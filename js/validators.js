// ★ ĐỔI MỖI BÀI: các validator của bài Python.
// Hợp đồng (mục 4.2): mọi validator trả về { passed, errors[], checks:[{ok,label,hint}] }.
// Khác bài HTML: với Python phải CHẠY mã nên các validator trả về Promise của kết quả trên.
const Validators = (() => {
  const chk = (ok, label, hint) => ({ ok: !!ok, label, hint: hint || "" });
  const result = (checks) => ({
    passed: checks.every((c) => c.ok),
    errors: checks.filter((c) => !c.ok).map((c) => c.hint || c.label),
    checks
  });

  // Rút gọn để so sánh kết quả in ra: GIỮ NGUYÊN dấu tiếng Việt (đề yêu cầu in đúng chữ), chỉ chuẩn hóa Unicode,
  // chữ thường, bỏ khoảng trắng và dấu câu cuối; × hoặc * đều coi là "x".
  const squash = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/[×*]/g, "x").replace(/\s+/g, "").replace(/[.,;!]+$/, "");
  const outLines = (out) => String(out || "").split("\n").map((l) => l.trim()).filter((l) => l !== "");
  const stripComments = (code) => String(code || "").split("\n").map((l) => l.replace(/#.*$/, "")).join("\n");
  const hasComment = (code) => /^\s*#\s*\S+/m.test(code || "");

  // So khớp đáp án gõ tự do: accept là mảng chuỗi (so sánh sau chuẩn hóa) hoặc RegExp (kiểm tra trên chuỗi đã chuẩn hóa).
  function matchAnswer(value, accept) {
    const v = Util.norm(value);
    if (!v) return false;
    return accept.some((a) => (a instanceof RegExp ? a.test(v) : Util.norm(a) === v));
  }

  // ---- Điền chỗ trống (kiểu 'fill') ----
  function fillBlanks(values, blanks) {
    return result(blanks.map((b) => chk(matchAnswer(values[b.id] || "", b.accept), b.label, b.hint)));
  }

  // ---- Từng bước trong cửa sổ Shell (kiểu 'steps') ----
  // Bước 'command': gõ lại đúng lệnh trong đề (so khớp sau chuẩn hóa) và Python chạy được (hoặc đúng là lỗi như đề dự kiến).
  function command(step, src, res) {
    const typed = step.expect.some((e) => Util.normCode(e) === Util.normCode(src));
    return result([
      chk(typed, "Gõ đúng lệnh", step.hint || "Chưa đúng rồi. Em đối chiếu lại lệnh mẫu: từng dấu ngoặc, dấu nháy, dấu phẩy."),
      chk(step.allowError ? true : !res.err, "Lệnh chạy không lỗi", "Python báo lỗi. Hãy đọc thông báo màu đỏ và sửa lại lệnh.")
    ]);
  }

  // Bước 'solve': em tự viết lệnh; so kết quả với lệnh chuẩn (step.reference).
  async function solve(step, src, res) {
    const ref = await Py.evalOnce(step.reference);
    const body = src.replace(/^\s*-/, "");
    const checks = [
      chk(!res.err, "Lệnh chạy không lỗi",
        /\d\s*[xX×]\s*\d/.test(src) ? "Python có lỗi. Dấu nhân trong Python là * chứ không phải chữ x hoặc dấu ×." : "Python báo lỗi. Hãy đọc thông báo màu đỏ và sửa lại lệnh."),
      chk(!res.err && res.out.trim() === ref.out.trim(), "Kết quả đúng", step.hint || "Kết quả chưa đúng với biểu thức của đề. Em kiểm tra lại số, dấu phép toán."),
      chk(/[-+*\/]/.test(body), "Dùng phép toán để Python tự tính", "Em hãy viết biểu thức để Python tính, đừng gõ sẵn đáp án.")
    ];
    return result(checks);
  }

  // Bước 'check': tự kiểm bằng hàm riêng (step.check(src, res) -> mảng chk hoặc true/false).
  function custom(step, src, res) {
    const r = step.check(src, res);
    return result(Array.isArray(r) ? r : [chk(r, "Đạt yêu cầu", step.hint)]);
  }

  // Bước 'answer': ô trả lời gõ tự do.
  function answer(step, value) {
    return result([chk(matchAnswer(value, step.accept), "Trả lời đúng", step.hint || "Chưa đúng rồi. Em đọc lại phần giới thiệu ở trên nhé.")]);
  }

  // ---- Chương trình nhiều dòng ----
  // Tìm các bảng cửu chương đầy đủ (a x 1..10) trong kết quả in ra. Chấp nhận dòng "a x b = c" hoặc lưới 10 số/hàng.
  function multiplicationTables(out) {
    const pairs = new Set();
    const rows = [];
    outLines(out).forEach((l) => {
      const nums = (l.match(/\d+/g) || []).map(Number);
      if (nums.length >= 3 && nums[0] * nums[1] === nums[2]) pairs.add(nums[0] + "x" + nums[1]);
      if (nums.length === 10) rows.push(nums);
    });
    rows.forEach((r, i) => {
      if (r.every((v, j) => v === (i + 1) * (j + 1))) r.forEach((v, j) => pairs.add((i + 1) + "x" + (j + 1)));
    });
    const full = [];
    for (let n = 1; n <= 10; n++) {
      let ok = true;
      for (let b = 1; b <= 10; b++) if (!pairs.has(n + "x" + b) && !pairs.has(b + "x" + n)) { ok = false; break; }
      if (ok) full.push(n);
    }
    return { pairs, full };
  }

  const POEM = ["Không có việc gì khó", "Chỉ sợ lòng không bền", "Đào núi và lấp biển", "Quyết chí ắt làm nên"];
  function poemPrinted(out) {
    const lines = outLines(out).map(squash);
    const want = POEM.map(squash);
    for (let i = 0; i + want.length <= lines.length; i++) {
      if (want.every((w, k) => lines[i + k] === w)) return true;
    }
    return false;
  }

  return { chk, result, squash, outLines, stripComments, hasComment, matchAnswer, fillBlanks, command, solve, custom, answer, multiplicationTables, poemPrinted, POEM };
})();
