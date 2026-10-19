// Trình soạn thảo mã: textarea + cột số dòng + phím Tab + chặn dán + ghi lại quá trình gõ (typingStats).
const Editor = {
  newStats() {
    return { keyCount: 0, changeCount: 0, charsTyped: 0, pasteBlocked: 0, pasteCount: 0, firstInputAt: null, lastInputAt: null };
  },

  // opts: { value, rows, readOnly, blockPaste, stats, placeholder, onChange(value), onRun(), onPasteBlocked() }
  create(host, opts = {}) {
    const stats = opts.stats || Editor.newStats();
    host.innerHTML = `<div class="ed"><div class="ed-gutter" aria-hidden="true"><div class="ed-nums"></div></div>` +
      `<textarea class="ed-area" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Soạn thảo chương trình Python"></textarea></div>`;
    const ta = host.querySelector(".ed-area");
    const nums = host.querySelector(".ed-nums");
    ta.rows = opts.rows || 8;
    ta.value = opts.value || "";
    ta.placeholder = opts.placeholder || "";
    ta.readOnly = !!opts.readOnly;

    function paintNumbers() {
      const n = Math.max(ta.value.split("\n").length, ta.rows);
      let s = "";
      for (let i = 1; i <= n; i++) s += i + "\n";
      nums.textContent = s;
      nums.style.transform = `translateY(${-ta.scrollTop}px)`;
    }
    paintNumbers();
    ta.addEventListener("scroll", () => { nums.style.transform = `translateY(${-ta.scrollTop}px)`; });

    function touch() {
      const t = Util.nowISO();
      if (!stats.firstInputAt) stats.firstInputAt = t;
      stats.lastInputAt = t;
    }

    ta.addEventListener("keydown", (e) => {
      if (opts.readOnly) return;
      stats.keyCount++;
      if (e.key === "F5" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        if (opts.onRun) opts.onRun();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertText", false, "    ");
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        // Tự thụt dòng giống dòng trên (thêm 4 dấu cách sau dấu hai chấm), như IDLE.
        const pos = ta.selectionStart;
        const before = ta.value.slice(0, pos);
        const line = before.slice(before.lastIndexOf("\n") + 1);
        let indent = (line.match(/^[ \t]*/) || [""])[0];
        if (/:\s*$/.test(line)) indent += "    ";
        if (indent) {
          e.preventDefault();
          document.execCommand("insertText", false, "\n" + indent);
        }
      }
    });

    ta.addEventListener("paste", (e) => {
      if (opts.blockPaste) {
        e.preventDefault();
        stats.pasteBlocked++;
        if (opts.onPasteBlocked) opts.onPasteBlocked();
      } else {
        stats.pasteCount++;
      }
    });
    ["drop"].forEach((ev) => ta.addEventListener(ev, (e) => {
      if (opts.blockPaste) { e.preventDefault(); stats.pasteBlocked++; if (opts.onPasteBlocked) opts.onPasteBlocked(); }
    }));

    ta.addEventListener("input", (e) => {
      stats.changeCount++;
      touch();
      if (e.inputType && e.inputType.startsWith("insert") && e.inputType !== "insertFromPaste" && e.inputType !== "insertFromDrop") {
        stats.charsTyped += (e.data ? e.data.length : 1);
      }
      paintNumbers();
      if (opts.onChange) opts.onChange(ta.value);
    });

    return {
      el: ta,
      stats,
      getValue: () => ta.value,
      setValue(v) { ta.value = v; paintNumbers(); },
      focus: () => ta.focus(),
      setReadOnly(b) { ta.readOnly = !!b; }
    };
  }
};
