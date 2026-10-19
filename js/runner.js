// Trình chạy Python thật trong trình duyệt (Pyodide, chạy trong Web Worker để không treo trang).
// Nạp lười: chỉ tải khi học sinh cần chạy lệnh (Py.warmUp() gọi sớm để đỡ chờ).
const Py = (() => {
  const PYODIDE_VER = "v0.26.4";
  const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VER}/full/`;
  const RUN_TIMEOUT = 10000;   // chương trình chạy quá 10 giây -> dừng (vòng lặp vô hạn)
  const INIT_TIMEOUT = 90000;  // lần tải đầu tiên có thể chậm

  // Mã Python chạy bên trong worker: giả lập IDLE Shell (từng lệnh) và Run Module (cả tệp).
  const PY_HELPER = String.raw`
import sys, json, code, builtins, traceback, linecache

LIMIT = 20000

class _Buf:
    def __init__(self):
        self.parts = []
        self.size = 0
    def write(self, s):
        s = str(s)
        if self.size < LIMIT:
            self.parts.append(s)
            self.size += len(s)
        return len(s)
    def flush(self):
        pass
    def isatty(self):
        return False
    def text(self):
        t = ''.join(self.parts)
        return t[:LIMIT] + '\n... (kết quả quá dài, đã được cắt bớt)' if len(t) > LIMIT else t

def _no_input(prompt=''):
    raise RuntimeError('Trang này chưa hỗ trợ lệnh input(). Em hãy dùng print() nhé.')
builtins.input = _no_input

_sessions = {}

def reset(sid):
    _sessions[sid] = code.InteractiveInterpreter({'__name__': '__main__'})

def _capture(fn):
    out, err = _Buf(), _Buf()
    so, se, eh = sys.stdout, sys.stderr, sys.excepthook
    sys.stdout, sys.stderr = out, err
    # Pyodide đổi excepthook nên traceback sẽ lộ các khung nội bộ; dùng hook mặc định để giống IDLE.
    sys.excepthook = sys.__excepthook__
    try:
        result = fn(err)
    finally:
        sys.stdout, sys.stderr, sys.excepthook = so, se, eh
    return out.text(), err.text(), result

def shell(sid, src, fname):
    if sid not in _sessions:
        reset(sid)
    interp = _sessions[sid]
    out, err, more = _capture(lambda e: interp.runsource(src, fname, 'single'))
    return json.dumps({'out': out, 'err': err, 'more': bool(more)})

def run_file(src, name):
    linecache.cache[name] = (len(src), None, src.splitlines(True), name)
    def go(err):
        try:
            co = compile(src, name, 'exec')
        except SyntaxError as e:
            err.write(''.join(traceback.format_exception_only(type(e), e)))
            return 1
        try:
            exec(co, {'__name__': '__main__'})
        except SystemExit:
            pass
        except BaseException as e:
            tb = e.__traceback__.tb_next
            err.write(''.join(traceback.format_exception(type(e), e, tb)))
            return 1
        return 0
    out, err, status = _capture(go)
    return json.dumps({'out': out, 'err': err, 'ok': status == 0})
`;

  const WORKER_JS = `
importScripts(${JSON.stringify(INDEX_URL + "pyodide.js")});
let py = null;
const HELPER = ${JSON.stringify(PY_HELPER)};
const ready = (async () => {
  py = await loadPyodide({ indexURL: ${JSON.stringify(INDEX_URL)} });
  py.runPython(HELPER);
})();
ready.catch(() => {});
self.onmessage = async (e) => {
  const { id, type, sid, src, name } = e.data;
  try {
    await ready;
    let res = {};
    if (type === 'shell') res = JSON.parse(py.globals.get('shell')(sid, src, name));
    else if (type === 'file') res = JSON.parse(py.globals.get('run_file')(src, name));
    else if (type === 'reset') py.globals.get('reset')(sid);
    self.postMessage({ id, res });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
`;

  let worker = null, initPromise = null, seq = 0, status = "idle";
  const pending = new Map();
  const listeners = new Set();

  function setStatus(s) {
    status = s;
    listeners.forEach((fn) => { try { fn(s); } catch (e) { /* bỏ qua */ } });
  }

  function failAll(message) {
    pending.forEach((p) => { clearTimeout(p.timer); p.reject(new Error(message)); });
    pending.clear();
  }

  function killWorker() {
    if (worker) { worker.terminate(); worker = null; }
    initPromise = null;
  }

  function post(msg, timeout) {
    return new Promise((resolve, reject) => {
      if (!worker) return reject(new Error("worker-not-started"));
      const id = ++seq;
      const timer = setTimeout(() => {
        pending.delete(id);
        failAll("timeout");           // worker đang kẹt: dừng hẳn, lần sau tự khởi động lại
        killWorker();
        setStatus("idle");
        reject(new Error("timeout"));
      }, timeout);
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, ...msg });
    });
  }

  // Khởi động worker (một lần) và chờ Pyodide sẵn sàng.
  function ensure() {
    if (initPromise) return initPromise;
    try {
      const url = URL.createObjectURL(new Blob([WORKER_JS], { type: "text/javascript" }));
      worker = new Worker(url);
    } catch (e) {
      setStatus("error");
      return (initPromise = Promise.reject(new Error("Trình duyệt không tạo được tiến trình chạy Python.")));
    }
    worker.onmessage = (e) => {
      const { id, res, error } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      clearTimeout(p.timer);
      error ? p.reject(new Error(error)) : p.resolve(res);
    };
    worker.onerror = () => { failAll("worker-error"); killWorker(); setStatus("error"); };
    setStatus("loading");
    initPromise = post({ type: "init" }, INIT_TIMEOUT)
      .then(() => { setStatus("ready"); })
      .catch((err) => { killWorker(); setStatus("error"); throw err; });
    return initPromise;
  }

  async function exec(msg, timeout) {
    try {
      await ensure();
      return await post(msg, timeout);
    } catch (e) {
      if (e.message === "timeout") {
        return { out: "", err: "Chương trình chạy quá lâu nên đã bị dừng (có thể bị lặp vô hạn).", timeout: true, ok: false, more: false };
      }
      return { out: "", err: "Không chạy được Python: " + e.message, failed: true, ok: false, more: false };
    }
  }

  // Gợi ý tiếng Việt cho các lỗi thường gặp (dựa vào dòng cuối của thông báo lỗi).
  function explain(errText) {
    if (!errText) return "";
    const last = errText.trim().split("\n").pop();
    if (/^IndentationError|unexpected indent|expected an indented block/.test(errText)) return "Lỗi thụt dòng: dòng lệnh bị lùi vào không đúng chỗ. Với lệnh đơn giản, hãy viết sát lề trái.";
    if (/^SyntaxError.*(unterminated string|EOL while)/.test(last)) return "Lỗi cú pháp: xâu kí tự chưa được đóng bằng dấu nháy ở cuối.";
    if (/^SyntaxError.*(never closed|was never closed)/.test(last)) return "Lỗi cú pháp: có dấu ngoặc mở nhưng thiếu dấu ngoặc đóng.";
    if (/^SyntaxError/.test(last)) return "Lỗi cú pháp: câu lệnh viết sai quy tắc của Python. Kiểm tra dấu nháy, dấu ngoặc và dấu phẩy.";
    if (/^NameError/.test(last)) return "Python không hiểu tên này. Có thể em gõ sai chính tả (ví dụ Print thay vì print) hoặc quên đặt chữ trong dấu nháy.";
    if (/^TypeError/.test(last)) return "Lỗi kiểu dữ liệu: các giá trị này không thực hiện được phép toán với nhau (ví dụ cộng số với chữ).";
    if (/^ZeroDivisionError/.test(last)) return "Không thể chia cho 0.";
    if (/^RuntimeError.*input/.test(last)) return "Trang này chưa hỗ trợ input(). Em dùng print() để in kết quả nhé.";
    return "";
  }

  return {
    get status() { return status; },
    onStatus(fn) { listeners.add(fn); fn(status); return () => listeners.delete(fn); },
    warmUp() { return ensure().catch(() => {}); },
    retry() { killWorker(); setStatus("idle"); return ensure().catch(() => {}); },
    // Một lệnh trong chế độ gõ lệnh trực tiếp (giữ biến giữa các lệnh cùng sid).
    shell(sid, src, label) { return exec({ type: "shell", sid, src, name: label || "<pyshell>" }, RUN_TIMEOUT); },
    reset(sid) { return exec({ type: "reset", sid }, RUN_TIMEOUT); },
    // Chạy cả chương trình (chế độ soạn thảo, Run Module).
    run(src, name) { return exec({ type: "file", src, name: name || "chuong_trinh.py" }, RUN_TIMEOUT); },
    // Đánh giá nhanh một lệnh trong phiên mới (dùng cho validator).
    async evalOnce(src) {
      const sid = "chk" + (++seq);
      const r = await exec({ type: "shell", sid, src, name: "<pyshell#1>" }, RUN_TIMEOUT);
      return r;
    },
    explain
  };
})();
