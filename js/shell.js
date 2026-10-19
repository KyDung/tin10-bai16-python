// Giao diện giả lập IDLE: cửa sổ Shell (chế độ gõ lệnh trực tiếp) và môi trường Idle đầy đủ
// (biểu tượng ngoài màn hình, cửa sổ soạn thảo, menu File/Run, hộp thoại Save, quit()).
// Mã Python được chạy THẬT bởi Py (Pyodide) trong runner.js.

const Win = {
  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2400);
  },
  titleBar(name) {
    return `<div class="win-title"><span class="win-ico">🐍</span><span class="win-name">${Util.esc(name)}</span>` +
      `<span class="win-btns" aria-hidden="true"><i>—</i><i>▢</i><i>✕</i></span></div>`;
  },
  menuBar(names) {
    return `<div class="win-menu" role="menubar">${names.map((n) => `<span class="mi" role="menuitem" tabindex="0" data-menu="${n}">${n}</span>`).join("")}</div>`;
  },
  // defs: { File: [{id,label,key}] } — menu không có trong defs chỉ là trang trí.
  bindMenu(bar, defs, onPick) {
    let drop = null;
    const close = () => { if (drop) { drop.remove(); drop = null; } };
    bar.addEventListener("click", (e) => {
      const mi = e.target.closest(".mi");
      if (!mi) return;
      e.stopPropagation();
      const wasOpen = drop && drop.dataset.for === mi.dataset.menu;
      close();
      if (wasOpen) return;
      const items = defs[mi.dataset.menu];
      if (!items) { Win.toast(`Mục "${mi.dataset.menu}" chưa dùng đến trong bài này.`); return; }
      drop = document.createElement("div");
      drop.className = "mdrop";
      drop.dataset.for = mi.dataset.menu;
      drop.innerHTML = items.map((it) => `<button type="button" data-id="${it.id}" ${it.off ? 'class="off"' : ""}><span>${Util.esc(it.label)}</span><kbd>${Util.esc(it.key || "")}</kbd></button>`).join("");
      drop.style.left = mi.offsetLeft + "px";
      bar.appendChild(drop);
      drop.addEventListener("click", (ev) => {
        const b = ev.target.closest("button");
        if (!b) return;
        ev.stopPropagation();
        close();
        if (b.classList.contains("off")) { Win.toast("Mục này chưa dùng đến trong bài."); return; }
        onPick(b.dataset.id);
      });
    });
    document.addEventListener("click", close);
  }
};

const Shell = {
  BANNER: [
    "Python 3.12.1 (tags/v3.12.1:2305ca5, Dec  7 2023, 22:03:25) [MSC v.1937 64 bit (AMD64)] on win32",
    'Type "help", "copyright", "credits" or "license()" for more information.'
  ],

  // opts: { sid, title, blockPaste, stats, tips, menus, onMenu(id), onResult({src,res}), onQuit(), onPasteBlocked() }
  create(host, opts = {}) {
    const sid = opts.sid || "sh" + Math.random().toString(36).slice(2, 8);
    const stats = opts.stats || Editor.newStats();
    host.innerHTML = `<div class="win win-shell">` + Win.titleBar(opts.title || "IDLE Shell 3.12.1") +
      Win.menuBar(["File", "Edit", "Shell", "Debug", "Options", "Window", "Help"]) +
      `<div class="sh-body"><div class="sh-log" role="log" aria-live="polite"></div>` +
      `<div class="sh-row"><span class="sh-p">&gt;&gt;&gt; </span><input class="sh-input" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" aria-label="Nhập lệnh Python rồi nhấn Enter"></div></div>` +
      `<div class="sh-status" hidden></div></div>`;
    const q = (s) => host.querySelector(s);
    const log = q(".sh-log"), input = q(".sh-input"), pEl = q(".sh-p"), body = q(".sh-body"), statusEl = q(".sh-status");
    Win.bindMenu(q(".win-menu"), opts.menus || {}, (id) => opts.onMenu && opts.onMenu(id));

    let buffer = [], n = 1, busy = false, dead = false;
    const hist = []; let hi = 0;

    const scroll = () => { body.scrollTop = body.scrollHeight; };
    function line(cls, html) {
      const d = document.createElement("div");
      d.className = "sh-line " + cls;
      d.innerHTML = html;
      log.appendChild(d);
      scroll();
      return d;
    }
    const text = (t, cls) => { if (t) line(cls, Util.esc(t.replace(/\n$/, "")) || "&nbsp;"); };
    const echo = (prompt, src) => line("sh-in", `<span class="sh-p">${prompt}</span>${Util.highlight(src)}`);

    Shell.BANNER.forEach((b) => text(b, "sh-out"));

    function showResult(res) {
      text(res.out, "sh-out");
      text(res.err, "sh-err");
      if (res.err && opts.tips !== false) {
        const tip = Py.explain(res.err);
        if (tip) line("sh-tip", "💡 " + Util.esc(tip));
      }
    }

    // Trạng thái trình chạy Python (lần đầu phải tải ~vài MB).
    const unsub = Py.onStatus((s) => {
      if (s === "loading") { statusEl.hidden = false; statusEl.innerHTML = "⏳ Đang chuẩn bị Python… (lần đầu có thể mất vài giây)"; }
      else if (s === "error") {
        statusEl.hidden = false;
        statusEl.innerHTML = `⚠️ Chưa tải được Python (cần kết nối mạng). <button type="button" class="link-btn">Thử lại</button>`;
        statusEl.querySelector("button").onclick = () => Py.retry();
      } else statusEl.hidden = true;
    });

    async function submit(forced) {
      if (busy || dead) return;
      const raw = forced != null ? forced : input.value;
      input.value = "";
      echo(pEl.textContent, raw);
      if (!buffer.length && raw.trim() === "") return;
      if (!buffer.length && /^(quit|exit)\(\)$/.test(raw.trim())) { kill(); if (opts.onQuit) opts.onQuit(); return; }
      if (raw.trim()) { hist.push(raw); hi = hist.length; }
      buffer.push(raw);
      const src = buffer.join("\n") + (buffer.length > 1 ? "\n" : "");
      busy = true; input.disabled = true;
      const res = await Py.shell(sid, src, `<pyshell#${n}>`);
      busy = false; input.disabled = dead;
      if (res.more) { pEl.textContent = "... "; if (!dead) input.focus(); return; }
      const full = buffer.join("\n");
      buffer = []; pEl.textContent = ">>> "; n++;
      showResult(res);
      if (opts.onResult) opts.onResult({ src: full, res });
      if (!dead) input.focus();
    }

    function kill() {
      dead = true; input.disabled = true;
      q(".sh-row").hidden = true;
    }

    input.addEventListener("keydown", (e) => {
      stats.keyCount++;
      if (e.key === "Enter") { e.preventDefault(); submit(); }
      else if (e.key === "ArrowUp" && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi]; }
      else if (e.key === "ArrowDown" && hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; }
    });
    input.addEventListener("input", (e) => {
      stats.changeCount++;
      const t = Util.nowISO();
      if (!stats.firstInputAt) stats.firstInputAt = t;
      stats.lastInputAt = t;
      if (e.inputType && e.inputType.startsWith("insert") && e.inputType !== "insertFromPaste") stats.charsTyped += e.data ? e.data.length : 1;
    });
    input.addEventListener("paste", (e) => {
      if (opts.blockPaste) {
        e.preventDefault();
        stats.pasteBlocked++;
        Win.toast("Em hãy tự gõ lệnh, không dán nhé!");
        if (opts.onPasteBlocked) opts.onPasteBlocked();
      } else stats.pasteCount++;
    });
    input.addEventListener("drop", (e) => { if (opts.blockPaste) e.preventDefault(); });
    body.addEventListener("click", () => { if (!window.getSelection().toString()) input.focus(); });

    return {
      el: host, stats, sid,
      focus: () => input.focus(),
      isDead: () => dead,
      // Kết quả khi chạy cả tệp từ cửa sổ soạn thảo (Run Module), hiển thị trong Shell như IDLE.
      showFileRun(path, res) {
        line("sh-restart", `= RESTART: ${Util.esc(path)} =`);
        showResult(res);
        buffer = []; pEl.textContent = ">>> ";
        scroll();
      },
      destroy() { unsub(); }
    };
  }
};

const Idle = {
  USER_PATH: "C:/Users/HocSinh/",

  // opts: { blockPaste, stats, onEvent(name, data) }
  create(host, opts = {}) {
    const emit = (name, data) => { if (opts.onEvent) opts.onEvent(name, data || {}); };
    const edStats = opts.stats || Editor.newStats();
    host.innerHTML = `<div class="desk">
      <div class="desk-icons"><button class="desk-icon" type="button" data-act="open" aria-label="Biểu tượng IDLE Python. Nháy đúp hoặc nhấn Enter để mở">
        <img src="images/python-logo.svg" alt="" width="44" height="44"><span>IDLE<br>(Python 3.12)</span></button></div>
      <div class="desk-wins" hidden><div class="idle-ed" hidden></div><div class="idle-sh"></div></div>
      <div class="desk-closed" hidden><p>Phiên làm việc của IDLE đã kết thúc.</p><button class="btn btn-ghost" type="button" data-act="reopen">Mở lại IDLE</button></div>
    </div>`;
    const q = (s) => host.querySelector(s);
    const wins = q(".desk-wins"), edHost = q(".idle-ed"), shHost = q(".idle-sh"), closed = q(".desk-closed"), icon = q(".desk-icon");
    let shell = null, ed = null, fileName = "", modified = false, code = "", sessionNo = 0;

    function openShell() {
      sessionNo++;
      wins.hidden = false; closed.hidden = true; icon.classList.add("running");
      shell = Shell.create(shHost, {
        sid: "idle" + sessionNo + "-" + Math.random().toString(36).slice(2, 6),
        blockPaste: opts.blockPaste, stats: edStats,
        menus: { File: [
          { id: "new", label: "New File", key: "Ctrl+N" },
          { id: "open", label: "Open…", key: "Ctrl+O", off: true },
          { id: "exit", label: "Exit", key: "Ctrl+Q", off: true }] },
        onMenu: (id) => { if (id === "new") newFile(); },
        onQuit: () => closeAll(),
        onPasteBlocked: () => emit("paste-blocked")
      });
      shell.focus();
      emit("open");
    }

    function closeAll() {
      if (shell) shell.destroy();
      shell = null; ed = null; fileName = ""; modified = false;
      edHost.hidden = true; edHost.innerHTML = ""; shHost.innerHTML = "";
      wins.hidden = true; closed.hidden = false; icon.classList.remove("running");
      emit("quit");
    }

    function winTitle() {
      if (!fileName) return "*Untitled*";
      const t = `${fileName} - ${Idle.USER_PATH}${fileName}`;
      return modified ? `*${t}*` : t;
    }
    const refreshTitle = () => { const el = edHost.querySelector(".win-name"); if (el) el.textContent = winTitle(); };

    function dialog(html) {
      const old = edHost.querySelector(".win-dlg");
      if (old) old.remove();
      const d = document.createElement("div");
      d.className = "win-dlg";
      d.innerHTML = `<div class="dlg-box">${html}</div>`;
      edHost.querySelector(".win").appendChild(d);
      return d;
    }

    function newFile() {
      if (!shell) return;
      if (ed) { Win.toast("Cửa sổ soạn thảo đã mở rồi."); edHost.querySelector(".ed-area").focus(); return; }
      edHost.hidden = false;
      edHost.innerHTML = `<div class="win win-editor">` + Win.titleBar("*Untitled*") +
        Win.menuBar(["File", "Edit", "Format", "Run", "Options", "Window", "Help"]) +
        `<div class="ied-host"></div></div>`;
      Win.bindMenu(edHost.querySelector(".win-menu"), {
        File: [{ id: "new", label: "New File", key: "Ctrl+N", off: true }, { id: "open", label: "Open…", key: "Ctrl+O", off: true },
          { id: "save", label: "Save", key: "Ctrl+S" }, { id: "saveas", label: "Save As…", key: "Ctrl+Shift+S" }],
        Run: [{ id: "check", label: "Check Module", key: "Alt+X", off: true }, { id: "run", label: "Run Module", key: "F5" }]
      }, (id) => { if (id === "save") save(false); else if (id === "saveas") save(true); else if (id === "run") run(); });
      code = ""; fileName = ""; modified = false;
      ed = Editor.create(edHost.querySelector(".ied-host"), {
        rows: 7, blockPaste: opts.blockPaste, stats: edStats,
        onChange: (v) => { code = v; if (fileName && !modified) { modified = true; refreshTitle(); } emit("edit", { code: v }); },
        onRun: () => run(),
        onPasteBlocked: () => { Win.toast("Em hãy tự gõ chương trình, không dán nhé!"); emit("paste-blocked"); }
      });
      ed.el.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(false); }
      });
      ed.focus();
      emit("new-file");
    }

    function save(asNew) {
      if (!ed) return;
      if (fileName && !asNew) { modified = false; refreshTitle(); emit("save", { name: fileName, code }); return; }
      const d = dialog(`<h4>Save As</h4><label>Tên tệp: <input class="dlg-input" type="text" value="" placeholder="ví dụ: Bai1.py" spellcheck="false" autocomplete="off"></label>` +
        `<p class="dlg-note">Lưu trong thư mục ${Idle.USER_PATH}</p><div class="dlg-btns"><button type="button" class="btn" data-ok>Save</button><button type="button" class="btn btn-ghost" data-cancel>Cancel</button></div>`);
      const inp = d.querySelector(".dlg-input");
      inp.focus();
      const confirm = () => {
        let name = inp.value.trim().replace(/[\\/:*?"<>|]/g, "");
        if (!name) { inp.classList.add("bad"); return; }
        if (!/\.py$/i.test(name)) name += ".py";
        fileName = name; modified = false;
        d.remove(); refreshTitle();
        emit("save", { name: fileName, code });
        ed.focus();
      };
      d.querySelector("[data-ok]").onclick = confirm;
      d.querySelector("[data-cancel]").onclick = () => { d.remove(); ed.focus(); };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") { d.remove(); ed.focus(); } });
    }

    async function run() {
      if (!ed || !shell) return;
      if (!fileName) {
        const d = dialog(`<h4>Source Must Be Saved</h4><p>IDLE cần em lưu chương trình thành một tệp trước khi chạy.<br>Hãy chọn <b>File → Save</b> hoặc nhấn <b>Ctrl+S</b>.</p><div class="dlg-btns"><button type="button" class="btn" data-ok>OK</button></div>`);
        d.querySelector("[data-ok]").onclick = () => { d.remove(); ed.focus(); };
        emit("run-blocked");
        return;
      }
      if (modified) { modified = false; refreshTitle(); emit("save", { name: fileName, code }); }
      const res = await Py.run(code, fileName);
      shell.showFileRun(Idle.USER_PATH + fileName, res);
      emit("run", { code, name: fileName, res });
      shell.focus();
    }

    icon.addEventListener("dblclick", () => { if (!shell) openShell(); });
    icon.addEventListener("keydown", (e) => { if (e.key === "Enter" && !shell) { e.preventDefault(); openShell(); } });
    closed.querySelector("[data-act=reopen]").onclick = () => openShell();

    return { stats: edStats, getCode: () => code, getFileName: () => fileName, destroy() { if (shell) shell.destroy(); } };
  }
};
