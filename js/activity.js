// Dựng giao diện làm bài cho một hoạt động. KHÔNG ĐỔI giữa các hoạt động; nội dung nằm ở learning/practice/final.js.
// Các kiểu (def.kind):
//   fill   – điền chỗ trống (kiến thức khái niệm)
//   steps  – từng bước trong cửa sổ Shell (gõ lệnh / tự viết lệnh / trả lời ngắn)
//   editor – viết chương trình nhiều dòng rồi Chạy / KIỂM TRA
//   idle   – thực hành trong môi trường IDLE giả lập (mở, tạo tệp, lưu, chạy, thoát)
// Mỗi record: { activityId, studentCode, attempts, passed, startedAt, completedAt, typingStats }.
const Activity = (() => {
  const $ = (root, sel) => root.querySelector(sel);
  const esc = Util.esc;

  function showFb(el, type, html) {
    el.className = "fb fb-" + type;
    el.innerHTML = html;
    el.hidden = false;
  }
  // Danh sách tiêu chí; tiêu chí chưa đạt kèm gợi ý ngay bên dưới (withHints).
  function checksHTML(res, withHints) {
    return `<ul class="checks">${res.checks.map((c) => `<li class="${c.ok ? "ok" : "no"}"><span>${c.ok ? "✓" : "○"}</span> ${esc(c.label)}${withHints && !c.ok && c.hint ? `<small>${c.hint}</small>` : ""}</li>`).join("")}</ul>`;
  }
  // Gợi ý khi chưa đúng: giọng hướng dẫn, không lộ đáp án.
  function failHTML(res, def, firstOnly) {
    if (def.showChecks) return `<strong>Chưa đúng rồi.</strong> Em xem các tiêu chí bên dưới và thử lại nhé!${checksHTML(res, true)}`;
    const hints = firstOnly ? res.errors.slice(0, 1) : res.errors;
    // Gợi ý do người soạn bài viết (tin cậy) nên cho phép thẻ <code>; không chèn dữ liệu của học sinh vào đây.
    const list = hints.length ? `<ul class="hints">${hints.map((h) => `<li>${h}</li>`).join("")}</ul>` : "";
    return `<strong>Chưa đúng rồi.</strong> Em thử lại nhé!${list}`;
  }
  function passHTML(def, extra) {
    return `<strong>Chính xác!</strong> ${def.success || ""}${extra || ""}`;
  }

  function markPassed(rec, ctx) {
    if (!rec.passed) { rec.passed = true; rec.completedAt = Util.nowISO(); }
    ctx.save();
    ctx.onPass();
  }

  // Chặn dán / thả vào các ô gõ thường (input).
  function guardInput(inp, stats) {
    inp.addEventListener("paste", (e) => { e.preventDefault(); stats.pasteBlocked++; Win.toast("Em hãy tự gõ, không dán nhé!"); });
    inp.addEventListener("drop", (e) => e.preventDefault());
    inp.addEventListener("keydown", () => { stats.keyCount++; });
    inp.addEventListener("input", (e) => {
      stats.changeCount++;
      const t = Util.nowISO();
      if (!stats.firstInputAt) stats.firstInputAt = t;
      stats.lastInputAt = t;
      if (e.inputType && e.inputType.startsWith("insert")) stats.charsTyped += e.data ? e.data.length : 1;
    });
  }

  const parseKV = (s) => {
    const o = {};
    String(s || "").split("\n").forEach((l) => { const i = l.indexOf("="); if (i > 0) o[l.slice(0, i)] = l.slice(i + 1); });
    return o;
  };

  // ---------------------------------------------------------------- fill
  function mountFill(box, def, ctx, rec, stats) {
    const vals = parseKV(rec.studentCode);
    box.innerHTML = `<div class="task task-fill">${def.task ? `<div class="task-text">${def.task}</div>` : ""}
      <div class="blanks">${def.blanks.map((b) => `<div class="blank" data-id="${b.id}">
        <div class="blank-q">${b.before || ""}<input class="blank-in" type="text" data-id="${b.id}" autocomplete="off" spellcheck="false" placeholder="${esc(b.placeholder || "gõ câu trả lời")}" value="${esc(vals[b.id] || "")}" size="${b.size || 16}">${b.after || ""}</div>
        <div class="blank-fb" hidden></div></div>`).join("")}</div>
      <div class="fb" role="status" hidden></div>
      <div class="task-actions"><button type="button" class="btn btn-primary" data-check>KIỂM TRA</button></div></div>`;
    const fb = $(box, ".fb");
    box.querySelectorAll(".blank-in").forEach((inp) => {
      guardInput(inp, stats);
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); check(); } });
    });
    if (rec.passed) showFb(fb, "ok", passHTML(def));

    async function check() {
      const values = {};
      box.querySelectorAll(".blank-in").forEach((i) => { values[i.dataset.id] = i.value; });
      const res = Validators.fillBlanks(values, def.blanks);
      rec.attempts++;
      rec.studentCode = Object.keys(values).map((k) => `${k}=${values[k]}`).join("\n");
      def.blanks.forEach((b, i) => {
        const row = box.querySelector(`.blank[data-id="${b.id}"]`);
        const f = row.querySelector(".blank-fb");
        const c = res.checks[i];
        row.classList.toggle("is-ok", c.ok);
        row.classList.toggle("is-bad", !c.ok);
        f.hidden = c.ok;
        f.textContent = c.ok ? "" : c.hint;
      });
      if (res.passed) { showFb(fb, "ok", passHTML(def)); markPassed(rec, ctx); }
      else { showFb(fb, "warn", `<strong>Chưa đúng rồi.</strong> Em xem gợi ý dưới từng ô và thử lại nhé.`); ctx.save(); }
    }
    $(box, "[data-check]").onclick = check;
    return { destroy() {} };
  }

  // ---------------------------------------------------------------- steps
  function mountSteps(box, def, ctx, rec, stats) {
    const steps = def.steps;
    const log = rec.studentCode ? rec.studentCode.split("\n") : [];
    let cur = rec.passed ? steps.length : 0;
    let judging = false;
    if (!rec.passed) log.length = 0;

    box.innerHTML = `<div class="task task-steps"><div class="steps-col"><ol class="step-list"></ol><div class="fb" role="status" hidden></div></div><div class="steps-shell ${def.withEditor ? "has-ed" : ""}"><div class="sh-host"></div>${def.withEditor ? `<div class="steps-editor">
      <div class="code-win"><div class="code-win-bar"><span>🐍 ${esc(def.fileName || "Bai.py")} – chế độ soạn thảo</span><small>F5 để chạy</small></div><div class="code-host"></div></div>
      <div class="task-actions"><button type="button" class="btn btn-primary btn-sm" data-prun>▶ Chạy chương trình (F5)</button></div>
      <pre class="out" aria-live="polite"><span class="o-none">Kết quả sẽ hiện ở đây.</span></pre></div>` : ""}</div></div>`;
    const list = $(box, ".step-list"), fb = $(box, ".fb");

    const shell = Shell.create($(box, ".sh-host"), {
      sid: "st-" + def.id + "-" + Math.random().toString(36).slice(2, 6),
      blockPaste: true, stats,
      onResult: (info) => judgeShell(info)
    });

    let ed = null;
    const edBox = $(box, ".steps-editor");
    if (edBox) {
      ed = Editor.create($(edBox, ".code-host"), { rows: 5, blockPaste: true, stats, onRun: () => runProgram(),
        onPasteBlocked: () => Win.toast("Em hãy tự gõ chương trình, không dán nhé!") });
      $(edBox, "[data-prun]").onclick = () => runProgram();
    }
    async function runProgram() {
      const step = steps[cur];
      const outEl = $(edBox, ".out");
      outEl.innerHTML = `<span class="o-none">Đang chạy…</span>`;
      const code = ed.getValue();
      const run = await Py.run(code, def.fileName || "Bai.py");
      renderRun(outEl, run);
      if (!step || step.type !== "program" || judging) return;
      rec.attempts++;
      const res = Validators.custom(step, code, run);
      if (res.passed) stepPassed(step, "[chương trình]\n" + code.trim());
      else { showFb(fb, "warn", failHTML(res, def, true)); ctx.save(); }
    }

    function render() {
      list.innerHTML = steps.map((s, i) => {
        const state = i < cur ? "done" : i === cur ? "cur" : "todo";
        const chip = (s.type === "command" || s.type === "program") && i <= cur ? `<code class="chip" oncopy="return false">${Util.highlight(s.show || s.expect[0])}</code>` : "";
        const ans = s.type === "answer" && i === cur
          ? `<div class="step-ans"><input class="step-in" type="text" autocomplete="off" spellcheck="false" placeholder="${esc(s.placeholder || "câu trả lời của em")}"><button type="button" class="btn btn-primary btn-sm" data-ans>Trả lời</button></div>` : "";
        return `<li class="step ${state}"><span class="step-no">${i < cur ? "✓" : i + 1}</span><div class="step-body"><div class="step-text">${s.text}</div>${chip}${ans}</div></li>`;
      }).join("");
      const inp = list.querySelector(".step-in");
      if (inp) {
        guardInput(inp, stats);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); judgeAnswer(inp.value); } });
        list.querySelector("[data-ans]").onclick = () => judgeAnswer(inp.value);
      }
      const curEl = list.querySelector(".step.cur");
      if (curEl && cur > 0) curEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function stepPassed(step, logText) {
      log.push(logText);
      const extra = step.explain ? `<div class="explain">${step.explain}</div>` : "";
      cur++;
      rec.studentCode = log.join("\n");
      if (cur >= steps.length) {
        showFb(fb, "ok", passHTML(def, extra));
        render();
        markPassed(rec, ctx);
      } else {
        showFb(fb, "ok", `<strong>Chính xác!</strong>${extra}`);
        render();
        ctx.save();
      }
    }

    async function judgeShell(info) {
      if (cur >= steps.length || judging) return;
      const step = steps[cur];
      if (step.type === "answer" || step.type === "program") return;     // bước trả lời / viết chương trình: Shell dùng để thử tự do
      judging = true;
      rec.attempts++;
      let res;
      try {
        if (step.type === "command") res = Validators.command(step, info.src, info.res);
        else if (step.type === "solve") res = await Validators.solve(step, info.src, info.res);
        else res = Validators.custom(step, info.src, info.res);
      } finally { judging = false; }
      if (res.passed) stepPassed(step, info.src);
      else { showFb(fb, "warn", failHTML(res, def, true)); ctx.save(); }
    }

    function judgeAnswer(value) {
      const step = steps[cur];
      if (!step || step.type !== "answer") return;
      rec.attempts++;
      const res = Validators.answer(step, value);
      if (res.passed) stepPassed(step, `[trả lời] ${value.trim()}`);
      else { showFb(fb, "warn", failHTML(res, def, true)); ctx.save(); }
    }

    render();
    if (rec.passed) showFb(fb, "ok", passHTML(def) + `<div class="explain">Em có thể gõ thêm lệnh vào cửa sổ bên cạnh để thử nghiệm.</div>`);
    return { destroy() { shell.destroy(); } };
  }

  // ---------------------------------------------------------------- editor
  function renderRun(outEl, run) {
    let html = "";
    if (run.out) html += `<span class="o-out">${esc(run.out)}</span>`;
    if (run.err) html += `<span class="o-err">${esc(run.err)}</span>`;
    const tip = Py.explain(run.err);
    if (tip) html += `<span class="o-tip">💡 ${esc(tip)}</span>`;
    if (!run.out && !run.err) html = `<span class="o-none">(Chương trình không in ra gì)</span>`;
    outEl.innerHTML = html;
  }

  function mountEditor(box, def, ctx, rec, stats) {
    const draftKey = "draft::" + def.id;
    const start = Store.get(draftKey) ?? (rec.studentCode || def.starter || "");
    box.innerHTML = `<div class="task task-editor">${def.task ? `<div class="task-text">${def.task}</div>` : ""}
      <div class="code-win"><div class="code-win-bar"><span>🐍 ${esc(def.fileName || "chuong_trinh.py")}</span><small>F5 hoặc Ctrl+Enter để chạy</small></div><div class="code-host"></div></div>
      <div class="task-actions"><button type="button" class="btn btn-ghost" data-run>▶ Chạy chương trình</button><button type="button" class="btn btn-primary" data-check>KIỂM TRA</button></div>
      <div class="out-wrap"><div class="out-title">Kết quả khi chạy</div><pre class="out" aria-live="polite"><span class="o-none">Bấm “Chạy chương trình” để xem kết quả.</span></pre></div>
      <div class="fb" role="status" hidden></div></div>`;
    const outEl = $(box, ".out"), fb = $(box, ".fb");
    const saveDraft = Util.debounce((v) => Store.set(draftKey, v), 400);
    const ed = Editor.create($(box, ".code-host"), {
      value: start, rows: def.rows || 8, blockPaste: true, stats,
      placeholder: def.placeholder || "",
      onChange: (v) => { saveDraft(v); if (def.onEdit) def.onEdit(v, box); },
      onRun: () => doRun(),
      onPasteBlocked: () => Win.toast("Em hãy tự gõ chương trình, không dán nhé!")
    });
    if (def.onEdit) def.onEdit(ed.getValue(), box);
    if (rec.passed) showFb(fb, "ok", passHTML(def));

    let running = false;
    async function doRun() {
      if (running) return null;
      running = true;
      outEl.innerHTML = `<span class="o-none">Đang chạy…</span>`;
      const run = await Py.run(ed.getValue(), def.fileName || "chuong_trinh.py");
      running = false;
      renderRun(outEl, run);
      return run;
    }
    $(box, "[data-run]").onclick = () => doRun();
    $(box, "[data-check]").onclick = async () => {
      const code = ed.getValue();
      if (!code.trim()) { showFb(fb, "warn", "<strong>Chưa có chương trình.</strong> Em hãy gõ lệnh vào khung trước nhé."); return; }
      const run = await doRun();
      if (!run) return;
      rec.attempts++;
      rec.studentCode = code;
      const res = await def.validate(code, run);
      if (res.passed) { showFb(fb, "ok", passHTML(def, def.showChecks ? checksHTML(res) : "")); markPassed(rec, ctx); }
      else { showFb(fb, "warn", failHTML(res, def, false)); ctx.save(); }
    };
    return { destroy() {} };
  }

  // ---------------------------------------------------------------- idle (thực hành)
  function mountIdle(box, def, ctx, rec, stats) {
    const flags = { open: false, newFile: false, typed: false, save: false, run: false };
    let code = "";
    box.innerHTML = `<div class="task task-idle"><div class="guide-col">
      ${def.sample ? `<div class="sample-box"><div class="sample-title">Chương trình mẫu (em tự gõ lại, không dán được)</div><pre class="sample" oncopy="return false">${Util.highlight(def.sample)}</pre></div>` : ""}
      <ol class="guide">${def.guide.map((g) => `<li data-k="${g.k}"><span class="gk">${g.n}</span><div>${g.text}</div></li>`).join("")}</ol>
      <div class="fb" role="status" hidden></div></div><div class="idle-col"></div></div>`;
    const fb = $(box, ".fb");

    function paint() {
      box.querySelectorAll(".guide li").forEach((li) => li.classList.toggle("done", !!flags[li.dataset.k]));
      const first = def.guide.find((g) => !flags[g.k]);
      box.querySelectorAll(".guide li").forEach((li) => li.classList.toggle("cur", !!first && li.dataset.k === first.k));
    }
    function finishIfDone() {
      paint();
      if (Object.values(flags).every(Boolean)) {
        rec.studentCode = code;
        showFb(fb, "ok", passHTML(def));
        markPassed(rec, ctx);
      }
    }
    if (rec.passed) { Object.keys(flags).forEach((k) => (flags[k] = true)); showFb(fb, "ok", passHTML(def)); }
    paint();

    const idle = Idle.create($(box, ".idle-col"), {
      blockPaste: true, stats,
      onEvent(name, data) {
        if (name === "open") flags.open = true;
        else if (name === "new-file") flags.newFile = true;
        else if (name === "edit") {
          code = data.code;
          flags.typed = def.checkCode(code).passed;
        } else if (name === "save") {
          const ok = Util.norm(data.name).replace(/\s+/g, "") === def.fileName.toLowerCase();
          flags.save = ok;
          if (!ok) showFb(fb, "warn", `<strong>Chưa đúng rồi.</strong> Hãy lưu tệp với tên <b>${esc(def.fileName)}</b> (chọn File → Save As… để đổi tên).`);
          else if (!flags.typed) showFb(fb, "warn", `<strong>Chương trình chưa đúng như mẫu.</strong> ${esc(def.checkCode(code).errors[0] || "")}`);
        } else if (name === "run") {
          rec.attempts++;
          code = data.code;
          const r = data.res;
          const okOut = r.ok && Validators.outLines(r.out).map(Validators.squash).join("|") === Validators.squash(def.expectOut);
          flags.run = !!okOut;
          if (!okOut) {
            const hint = r.err ? "Chương trình báo lỗi. Em đọc thông báo màu đỏ trong cửa sổ Shell rồi sửa lại." : "Kết quả chưa như yêu cầu. Chương trình mẫu in ra dòng chữ Xin chào!";
            showFb(fb, "warn", `<strong>Chưa đúng rồi.</strong> ${hint}`);
          } else showFb(fb, "ok", `<strong>Chạy đúng rồi!</strong> Dòng chữ hiện ra trong cửa sổ Shell.`);
        } else if (name === "run-blocked") {
          showFb(fb, "warn", "<strong>Chưa chạy được.</strong> Em cần lưu chương trình (Ctrl+S) trước, rồi mới chạy (F5).");
        }
        finishIfDone();
        ctx.save();
      }
    });
    return { destroy() { idle.destroy(); } };
  }

  // ---------------------------------------------------------------- vào cửa
  function mount(box, def, ctx) {
    const rec = ctx.record;
    rec.activityId = def.id;
    rec.attempts = rec.attempts || 0;
    rec.startedAt = rec.startedAt || Util.nowISO();
    rec.typingStats = Object.assign(Editor.newStats(), rec.typingStats || {});
    const stats = rec.typingStats;
    const kinds = {
      fill: mountFill, steps: mountSteps, editor: mountEditor, idle: mountIdle,
      custom: (b, d, c, r, s) => d.mount(b, c, r, s)     // hoạt động có giao diện riêng (Khởi động)
    };
    return kinds[def.kind](box, def, ctx, rec, stats);
  }

  return { mount, showFb, checksHTML, renderRun, guardInput };
})();
