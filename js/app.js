// Điều phối: trạng thái, route theo hash, khóa/mở khóa tuần tự, thanh tiến độ, nộp phần 1 / vận dụng.
// 4 hoạt động tuần tự: Khởi động -> Hình thành kiến thức (5) -> Luyện tập (3) -> Vận dụng. Chưa đạt hoạt động trước thì khóa hoạt động sau.
const App = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = Util.esc;
  let state = null;
  let mounted = null;        // hoạt động đang hiển thị (để destroy khi chuyển trang)
  let submitting = false;

  const freshState = () => ({
    v: 1, student: null, intro: {},
    learning: Learning.activities.map(() => ({})),
    practice: Practice.activities.map(() => ({})),
    part1SubmittedAt: null, final: {}, finalSubmittedAt: null
  });

  function load() {
    const s = Store.get("state");
    state = freshState();
    if (s && s.student) {
      Object.assign(state, s);
      while (state.learning.length < Learning.activities.length) state.learning.push({});
      while (state.practice.length < Practice.activities.length) state.practice.push({});
      verifyState();
    }
  }
  function save() { Store.set("state", state); }

  // Chống sửa localStorage để "mở khóa": chạy lại các kiểm tra tĩnh trên mã đã lưu. (Hoạt động cần chạy Python chỉ kiểm tra có bài làm.)
  function verifyState() {
    const kv = (s) => { const o = {}; String(s || "").split("\n").forEach((l) => { const i = l.indexOf("="); if (i > 0) o[l.slice(0, i)] = l.slice(i + 1); }); return o; };
    const check = (def, rec) => {
      if (!rec || !rec.passed) return;
      const code = String(rec.studentCode || "");
      let ok = code.trim().length > 0;
      if (ok && def.kind === "fill") ok = Validators.fillBlanks(kv(code), def.blanks).passed;
      if (ok && def.kind === "idle") ok = def.checkCode(code).passed;
      if (!ok) { rec.passed = false; rec.completedAt = null; }
    };
    if (state.intro && state.intro.passed) {
      const o = kv(state.intro.studentCode);
      if (o.choice !== "python") state.intro.passed = false;
    }
    Learning.activities.forEach((d, i) => check(d, state.learning[i]));
    Practice.activities.forEach((d, i) => check(d, state.practice[i]));
  }

  // ---- thứ tự các màn hình
  function sequence() {
    const seq = [{ route: "intro", def: Intro.def, rec: state.intro, group: "intro" }];
    Learning.activities.forEach((d, i) => seq.push({ route: "learn/" + d.id, def: d, rec: state.learning[i], group: "learn", idx: i }));
    Practice.activities.forEach((d, i) => seq.push({ route: "practice/" + d.id, def: d, rec: state.practice[i], group: "practice", idx: i }));
    seq.push({ route: "final", group: "final", def: Final.def });
    seq.push({ route: "done", group: "done" });
    return seq;
  }
  const isDone = (it) => (it.group === "final" ? !!state.finalSubmittedAt : it.group === "done" ? false : !!(it.rec && it.rec.passed));
  function frontier(seq) {
    const i = seq.findIndex((it) => !isDone(it));
    return i < 0 ? seq.length - 1 : i;
  }
  function canAccess(route, seq) {
    if (route === "info") return true;
    if (!state.student) return false;
    const idx = seq.findIndex((it) => it.route === route);
    return idx >= 0 && idx <= frontier(seq);
  }

  function go(route) {
    if (location.hash === "#" + route) onRoute();
    else location.hash = route;
  }

  function onRoute() {
    const seq = sequence();
    let route = location.hash.replace(/^#/, "");
    if (!route) route = state.student ? seq[frontier(seq)].route : "info";
    if (!canAccess(route, seq)) {
      const target = state.student ? seq[frontier(seq)].route : "info";
      if (location.hash !== "#" + target) { location.replace("#" + target); return; }
      route = target;
    }
    if (mounted) { mounted.destroy(); mounted = null; }
    renderChrome(seq, route);
    const item = seq.find((it) => it.route === route);
    window.scrollTo({ top: 0 });
    if (route === "info") renderInfo();
    else if (item.group === "final") renderFinal(seq);
    else if (item.group === "done") renderDone();
    else renderActivity(item, seq);
  }

  // ---- khung: thanh trên, thanh bên (stepper), tiến độ
  const GROUPS = [
    { key: "intro", num: 1, title: "Khởi động" },
    { key: "learn", num: 2, title: "Hình thành kiến thức" },
    { key: "practice", num: 3, title: "Luyện tập" },
    { key: "final", num: 4, title: "Vận dụng" }
  ];
  function renderChrome(seq, route) {
    const chip = $("#student-chip");
    chip.hidden = !state.student;
    $("#btn-switch-top").hidden = !state.student;
    if (state.student) chip.innerHTML = `<span class="avatar" aria-hidden="true">${esc(state.student.name.trim().slice(0, 1).toUpperCase())}</span><span><b>${esc(state.student.name)}</b><small>Lớp ${esc(state.student.className)}</small></span>`;
    const nav = $("#stepper");
    nav.hidden = !state.student || route === "info";
    document.body.classList.toggle("no-nav", nav.hidden);
    if (nav.hidden) { $("#progress").hidden = true; return; }
    const fi = frontier(seq);
    const acts = seq.filter((it) => it.group !== "done");
    const doneCount = acts.filter(isDone).length;
    $("#progress").hidden = false;
    $("#progress-bar").style.width = Math.round((doneCount / acts.length) * 100) + "%";
    $("#progress-text").textContent = `${doneCount}/${acts.length} hoạt động`;
    nav.innerHTML = GROUPS.map((g) => {
      const items = seq.filter((it) => it.group === g.key);
      const doneInGroup = items.filter(isDone).length;
      const lis = items.map((it) => {
        const idx = seq.indexOf(it);
        const d = it.def || {};
        const state_ = isDone(it) ? "done" : idx === fi ? "cur" : idx < fi ? "open" : "locked";
        const mark = state_ === "done" ? "✓" : state_ === "locked" ? "🔒" : state_ === "cur" ? "▶" : "•";
        const label = `<span class="si-mark">${mark}</span><span class="si-name">${esc(d.name || "")}</span>`;
        return state_ === "locked"
          ? `<li><span class="si locked" aria-disabled="true">${label}</span></li>`
          : `<li><a class="si ${state_} ${it.route === route ? "active" : ""}" href="#${it.route}" ${it.route === route ? 'aria-current="page"' : ""}>${label}</a></li>`;
      }).join("");
      return `<div class="sg"><div class="sg-title"><span class="sg-num">${g.num}</span><b>${g.title}</b><small>${doneInGroup}/${items.length}</small></div><ul>${lis}</ul></div>`;
    }).join("") + `<a class="done-link ${seq[fi].group === "done" || isDone(seq[seq.length - 2]) ? "" : "off"}" href="#done">🏁 Tổng kết</a>`;
  }

  // ---- đồng bộ nền (ghi tiến độ lên Firestore, im lặng nếu lỗi)
  function setSync(s) {
    const el = $("#sync");
    el.dataset.s = s;
    el.textContent = s === "ok" ? "Đã lưu" : s === "pending" ? "Đang lưu…" : s === "demo" ? "Chế độ thử: không gửi bài" : s === "off" ? "" : "Chưa gửi được";
    el.title = s === "fail" ? "Chưa gửi được lên máy chủ. Bài làm vẫn được lưu trên máy này." : "";
  }
  const exportRec = (def, r) => ({
    activityId: def.id, studentCode: String(r.studentCode || "").slice(0, 20000), attempts: r.attempts || 0, passed: !!r.passed,
    startedAt: r.startedAt || null, completedAt: r.completedAt || null, typingStats: r.typingStats || null
  });
  function payload() {
    return {
      student: state.student,
      learning: [exportRec(Intro.def, state.intro), ...Learning.activities.map((d, i) => exportRec(d, state.learning[i]))],
      practice: Practice.activities.map((d, i) => exportRec(d, state.practice[i])),
      part1SubmittedAt: state.part1SubmittedAt
    };
  }
  async function syncProgress() {
    if (!state.student || !Api.configured()) return;
    setSync("pending");
    try { await Api.send("progress", payload()); setSync("ok"); } catch (e) { setSync("fail"); }
  }
  const scheduleSync = Util.debounce(syncProgress, 1500);

  // ---- Trang thông tin học sinh
  function renderInfo() {
    const s = state.student;
    $("#stage").innerHTML = `
      <section class="hero card">
        <div class="hero-text">
          <p class="eyebrow">${esc(LESSON.subtitle)}</p>
          <h1>${esc(LESSON.title)}</h1>
          <p class="hero-sub">Cùng khám phá vì sao Python “dễ hiểu” với con người, rồi tự tay viết và chạy chương trình Python đầu tiên của em!</p>
          <div class="objectives"><h2>SAU BÀI NÀY EM SẼ</h2><ul>
            <li>Biết khái niệm <b>ngôn ngữ lập trình bậc cao</b> và ngôn ngữ lập trình bậc cao Python.</li>
            <li>Phân biệt được <b>chế độ gõ lệnh trực tiếp</b> và <b>chế độ soạn thảo</b> chương trình trong môi trường lập trình Python.</li>
            <li>Biết cách <b>tạo và thực hiện</b> một chương trình Python.</li></ul></div>
        </div>
        <div class="hero-art" aria-hidden="true"><img src="images/python-logo.svg" alt="" width="120" height="120">
          <pre class="hero-code">${Util.highlight('>>> print("Xin chào!")\nXin chào!')}</pre></div>
      </section>
      <section class="road"><h2>Hành trình hôm nay</h2><ol class="road-list">
        <li><span>🚀</span><b>Khởi động</b><small>Quan sát, đoán xem ngôn ngữ nào dễ hiểu</small></li>
        <li><span>📚</span><b>Hình thành kiến thức</b><small>5 hoạt động nhỏ, vừa học vừa gõ lệnh</small></li>
        <li><span>✏️</span><b>Luyện tập</b><small>3 bài tự làm, không có lệnh mẫu</small></li>
        <li><span>🌟</span><b>Vận dụng</b><small>1 chương trình hoàn chỉnh: bài thơ và bảng nhân</small></li></ol></section>
      <section class="card start-card">
        ${s ? `<h2>Chào mừng em trở lại, ${esc(s.name)}!</h2><p>Bài làm của em vẫn được lưu trên máy này.</p>
          <div class="task-actions"><button type="button" class="btn btn-primary" id="btn-continue">Tiếp tục học →</button><button type="button" class="btn btn-ghost" id="btn-switch">Không phải em? Đổi người học</button></div>`
        : `<h2>Bắt đầu nào!</h2><p>Em nhập họ tên và lớp để thầy cô nhận được kết quả của em.</p>
          <form id="info-form" class="info-form" novalidate>
            <label>Họ và tên<input id="in-name" type="text" autocomplete="name" maxlength="40" placeholder="Ví dụ: Nguyễn Văn An" required></label>
            <label>Lớp<input id="in-class" type="text" autocomplete="off" maxlength="15" placeholder="Ví dụ: 10A1" required></label>
            <p class="form-err" id="info-err" role="alert" hidden></p>
            <button type="submit" class="btn btn-primary btn-lg">Bắt đầu học →</button></form>`}
      </section>`;
    if (s) {
      $("#btn-continue").onclick = () => go("");
      $("#btn-switch").onclick = () => switchStudent();
    } else {
      $("#info-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = $("#in-name").value.trim().replace(/\s+/g, " ");
        const cls = $("#in-class").value.trim().replace(/\s+/g, "");
        const err = $("#info-err");
        const bad = !Util.slug(name, 40) || name.length < 2 ? "Em nhập họ và tên (ít nhất 2 chữ cái) nhé."
          : !Util.slug(cls, 15) ? "Em nhập lớp (ví dụ 10A1) nhé." : "";
        if (bad) { err.textContent = bad; err.hidden = false; return; }
        state.student = { name, className: cls.toUpperCase() };
        save();
        Py.warmUp(); Api.warmUp(); syncProgress();
        go("intro");
      });
    }
  }

  // Đổi người làm bài: xóa bài làm lưu trên máy này (bài đã nộp vẫn nằm trên Firebase) và về trang nhập tên.
  function switchStudent() {
    if (!confirm("Đổi người làm bài sẽ xóa bài làm đang lưu trên máy này. Bài đã nộp cho thầy cô vẫn được giữ. Em chắc chứ?")) return;
    Store.clearAll();
    load();
    if (location.hash === "#info") onRoute(); else location.hash = "info";
  }

  // ---- Trang một hoạt động (Khởi động, Hình thành, Luyện tập)
  const GROUP_LABEL = { intro: "Hoạt động 1 · Khởi động", learn: "Hoạt động 2 · Hình thành kiến thức", practice: "Hoạt động 3 · Luyện tập" };
  function renderActivity(item, seq) {
    const def = item.def, rec = item.rec;
    const total = seq.filter((it) => it.group === item.group).length;
    const label = GROUP_LABEL[item.group] + (total > 1 ? ` (${(item.idx ?? 0) + 1}/${total})` : "");
    const idx = seq.indexOf(item);
    const prev = idx > 0 ? seq[idx - 1] : null;
    const isLastPractice = item.group === "practice" && item.idx === Practice.activities.length - 1;
    $("#stage").innerHTML = `
      <article class="card act">
        <header class="act-head"><span class="act-badge">${label}</span><h2><span class="act-icon" aria-hidden="true">${def.icon}</span> ${esc(def.title)}</h2>
          ${def.lead ? `<p class="lead">${def.lead}</p>` : ""}</header>
        ${def.intro ? `<div class="act-intro">${def.intro}</div>` : ""}
        <div class="act-task" id="act-task"></div>
        <div class="act-recap" id="act-recap" hidden></div>
        <div id="part1-box"></div>
        <nav class="act-nav"><span>${prev && prev.group !== "info" ? `<a class="btn btn-ghost" href="#${prev.route}">← Quay lại</a>` : ""}</span>
          <button type="button" class="btn btn-primary" id="btn-next" hidden></button></nav>
      </article>`;
    const ctx = {
      record: rec,
      save() { save(); scheduleSync(); },
      onPass() { afterPass(); }
    };
    function afterPass() {
      renderChrome(sequence(), item.route);
      if (def.recap) { const r = $("#act-recap"); r.hidden = false; r.innerHTML = `<h4>📝 Ghi nhớ</h4>${def.recap}`; }
      const next = $("#btn-next");
      if (isLastPractice) {
        next.hidden = true;
        renderPart1Box();
      } else {
        const nx = seq[idx + 1];
        next.hidden = false;
        next.textContent = `Tiếp tục: ${nx.def ? nx.def.name : "Vận dụng"} →`;
        next.onclick = () => go(nx.route);
      }
    }
    mounted = Activity.mount($("#act-task"), def, ctx);
    if (rec.passed) afterPass();
    if (def.kind !== "fill" && def.kind !== "custom") Py.warmUp();
  }

  // ---- Nộp phần 1 (cuối Luyện tập)
  function renderPart1Box() {
    const box = $("#part1-box");
    const done = !!state.part1SubmittedAt;
    box.innerHTML = `<div class="submit-box">
      <h3>🎉 Em đã hoàn thành Phần 1!</h3>
      <p>Khởi động, Hình thành kiến thức và Luyện tập đều đã xong. Bấm nút bên dưới để <b>nộp Phần 1</b> cho thầy cô.</p>
      <p class="msg" id="p1-msg" role="status">${done ? "✅ Em đã nộp Phần 1. Em có thể nộp lại nếu muốn." : ""}</p>
      <div class="task-actions"><button type="button" class="btn btn-primary btn-lg" id="btn-p1">${done ? "Nộp lại Phần 1" : "NỘP PHẦN 1"}</button>
        <button type="button" class="btn ${done ? "btn-primary" : "btn-ghost"} btn-lg" id="btn-to-final">Sang Vận dụng →</button></div></div>`;
    $("#btn-to-final").onclick = () => go("final");
    $("#btn-p1").onclick = () => submitPart1();
  }
  async function submitPart1() {
    if (submitting) return;
    const btn = $("#btn-p1"), msg = $("#p1-msg");
    submitting = true; btn.setAttribute("aria-disabled", "true"); btn.textContent = "Đang nộp…";
    msg.className = "msg"; msg.textContent = "";
    try {
      const at = Util.nowISO();
      const p = payload(); p.part1SubmittedAt = at;
      await Api.send("part1", p);
      state.part1SubmittedAt = at; save();
      msg.className = "msg ok"; msg.textContent = "✅ Đã nộp Phần 1 cho thầy cô. Em sang Vận dụng nhé!";
      btn.textContent = "Nộp lại Phần 1";
      $("#btn-to-final").className = "btn btn-primary btn-lg";
    } catch (e) {
      msg.className = "msg err";
      msg.textContent = Api.configured() ? "Không thể gửi bài lúc này. Em kiểm tra kết nối mạng rồi bấm nộp lại. Bài làm của em vẫn còn trên máy." : "Chưa cấu hình Firebase nên chưa gửi được. Bài làm của em vẫn được lưu trên máy.";
      btn.textContent = "Thử nộp lại";
    } finally {
      submitting = false; btn.removeAttribute("aria-disabled");
    }
  }

  // ---- Hoạt động 4: Vận dụng
  function renderFinal(seq) {
    const fdef = Final.def;
    const rec = state.final;
    rec.attempts = rec.attempts || 0;
    rec.startedAt = rec.startedAt || Util.nowISO();
    rec.typingStats = Object.assign(Editor.newStats(), rec.typingStats || {});
    $("#stage").innerHTML = `
      <article class="card act final-card">
        <header class="act-head"><span class="act-badge">Hoạt động 4 · Vận dụng</span><h2><span class="act-icon" aria-hidden="true">${fdef.icon}</span> ${esc(fdef.title)}</h2>
          <p class="lead">Dùng những gì em đã học để viết một chương trình Python hoàn chỉnh.</p></header>
        ${state.part1SubmittedAt ? "" : `<div class="fb fb-warn"><strong>Lưu ý:</strong> em chưa nộp Phần 1. Khi nộp Vận dụng, hệ thống sẽ nộp bù Phần 1 cho em.</div>`}
        <div class="final-grid">
          <div class="final-task">${Final.TASK_HTML}</div>
          <div class="final-work">
            <div class="code-win"><div class="code-win-bar"><span>🐍 ${esc(fdef.fileName)}</span><small>F5 hoặc Ctrl+Enter để chạy</small></div><div class="code-host" id="f-host"></div></div>
            <div class="task-actions"><button type="button" class="btn btn-ghost" id="f-run">▶ Chạy chương trình</button></div>
            <div class="out-wrap"><div class="out-title">Kết quả khi chạy</div><pre class="out" id="f-out" aria-live="polite"><span class="o-none">Bấm “Chạy chương trình” để xem kết quả.</span></pre></div>
            <div class="checklist-card"><h4>Em đã đạt những yêu cầu nào?</h4><ul class="checklist" id="f-list"></ul></div>
            <p class="msg" id="f-msg" role="status"></p>
            <div class="task-actions"><button type="button" class="btn btn-primary btn-lg" id="f-submit" aria-disabled="true">NỘP BÀI VẬN DỤNG</button></div>
            ${state.finalSubmittedAt ? `<p class="msg ok">✅ Em đã nộp bài lúc ${new Date(state.finalSubmittedAt).toLocaleString("vi-VN")}. Sửa và nộp lại cũng được.</p>` : ""}
          </div>
        </div>
      </article>`;
    const draftKey = "draft::" + fdef.id;
    const initial = Store.get(draftKey) ?? rec.code ?? "";
    let lastRun = null;
    const currentRun = () => (lastRun && lastRun.code === ed.getValue() ? lastRun : null);
    const paint = () => {
      const ev = Final.evaluate(ed.getValue(), currentRun());
      $("#f-list").innerHTML = ev.checks.map((c) => `<li class="${c.ok ? "ok" : c.pending ? "pending" : "no"}${c.required ? "" : " bonus"}"><span class="cm">${c.ok ? "✓" : c.pending ? "…" : "○"}</span><div><b>${esc(c.label)}</b>${!c.ok && !c.pending ? `<small>${esc(c.hint)}</small>` : c.pending ? "<small>Chạy chương trình để kiểm tra</small>" : ""}</div></li>`).join("");
      $("#f-submit").setAttribute("aria-disabled", ev.passed ? "false" : "true");
      return ev;
    };
    const saveDraft = Util.debounce((v) => Store.set(draftKey, v), 400);
    const ed = Editor.create($("#f-host"), {
      value: initial, rows: fdef.rows, blockPaste: true, stats: rec.typingStats,
      placeholder: "# Gõ chương trình của em ở đây",
      onChange: (v) => { saveDraft(v); paint(); },
      onRun: () => doRun(),
      onPasteBlocked: () => Win.toast("Em hãy tự gõ chương trình, không dán nhé!")
    });
    let running = false;
    async function doRun() {
      if (running) return;
      running = true;
      $("#f-out").innerHTML = `<span class="o-none">Đang chạy…</span>`;
      const code = ed.getValue();
      const run = await Py.run(code, fdef.fileName);
      running = false;
      lastRun = { code, out: run.out, err: run.err };
      Activity.renderRun($("#f-out"), run);
      paint();
    }
    $("#f-run").onclick = doRun;
    paint();
    Py.warmUp();

    $("#f-submit").onclick = async () => {
      if (submitting) return;
      const msg = $("#f-msg"), btn = $("#f-submit");
      const code = ed.getValue();
      if (!code.trim()) { msg.className = "msg err"; msg.textContent = "Em chưa viết chương trình nào cả."; return; }
      // Chưa chạy bản mã hiện tại -> chạy giúp để kiểm tra các yêu cầu cần kết quả.
      if (!currentRun()) await doRun();
      const ev = paint();
      if (!ev.passed) {
        const missing = ev.checks.filter((c) => c.required && !c.ok).map((c) => c.label);
        msg.className = "msg err";
        msg.innerHTML = `<b>Chưa nộp được. Còn thiếu:</b><ul>${missing.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`;
        return;
      }
      submitting = true; btn.setAttribute("aria-disabled", "true"); btn.textContent = "Đang nộp…";
      msg.className = "msg"; msg.textContent = "";
      rec.attempts++;
      try {
        const at = Util.nowISO();
        if (!state.part1SubmittedAt) {                       // nộp bù Phần 1 nếu chưa nộp
          const p = payload(); p.part1SubmittedAt = at;
          await Api.send("part1", p);
          state.part1SubmittedAt = at;
        }
        const final = { code: code.slice(0, 100000), characters: code.length, typingStats: rec.typingStats, requirements: ev.requirements, submittedAt: at };
        await Api.send("final", { student: state.student, final });
        Object.assign(rec, { code, passed: true, completedAt: at, requirements: ev.requirements });
        state.finalSubmittedAt = at; save();
        msg.className = "msg ok"; msg.textContent = "✅ Đã nộp bài thành công! Chúc mừng em!";
        renderChrome(sequence(), "final");
        setTimeout(() => go("done"), 1500);
        setTimeout(() => { submitting = false; }, 5000);       // khóa chống bấm liên tiếp
        return;
      } catch (e) {
        msg.className = "msg err";
        msg.textContent = Api.configured() ? "Không thể gửi bài lúc này. Em kiểm tra mạng rồi bấm nộp lại. Chương trình của em vẫn được lưu trên máy." : "Chưa cấu hình Firebase nên chưa gửi được.";
        save();
      }
      submitting = false; btn.textContent = "NỘP LẠI"; btn.setAttribute("aria-disabled", "false");
    };
    mounted = { destroy() {} };
  }

  // ---- Trang hoàn thành
  function renderDone() {
    const rows = [
      ["🚀 Khởi động", state.intro], ...Learning.activities.map((d, i) => ["📚 " + d.name, state.learning[i]]),
      ...Practice.activities.map((d, i) => ["✏️ " + d.name, state.practice[i]])
    ];
    const finalOk = !!state.finalSubmittedAt;
    $("#stage").innerHTML = `
      <section class="card done-card">
        <div class="done-head"><div class="trophy" aria-hidden="true">🏆</div><h1>Chúc mừng ${esc(state.student.name)}!</h1>
          <p>Em đã hoàn thành <b>${esc(LESSON.title)}</b>.</p></div>
        <div class="done-grid">
          <div><h3>Em đã học được</h3><ul class="learned">${Learning.learned.map((t) => `<li>${esc(t)}</li>`).join("")}<li>Viết chương trình in bài thơ nhiều dòng và bảng nhân</li></ul></div>
          <div><h3>Kết quả các hoạt động</h3><table class="result-table"><thead><tr><th>Hoạt động</th><th>Số lần thử</th><th></th></tr></thead><tbody>
            ${rows.map(([n, r]) => `<tr><td>${esc(n)}</td><td>${r.attempts || 0}</td><td>${r.passed ? "✅" : "—"}</td></tr>`).join("")}
            <tr><td>🌟 Vận dụng</td><td>${state.final.attempts || 0}</td><td>${finalOk ? "✅ Đã nộp" : "—"}</td></tr></tbody></table></div>
        </div>
        <p class="done-note">Bài làm của em đã được gửi cho thầy cô. Em có thể quay lại xem bất kì hoạt động nào ở thanh bên trái.</p>
      </section>`;
    mounted = { destroy() {} };
  }

  function init() {
    load();
    setSync(Api.DEMO ? "demo" : "off");
    window.addEventListener("hashchange", onRoute);
    $("#btn-switch-top").addEventListener("click", switchStudent);
    $("#nav-toggle").addEventListener("click", () => {
      const nav = $("#stepper");
      const open = nav.classList.toggle("open");
      $("#nav-toggle").setAttribute("aria-expanded", open);
    });
    $("#stepper").addEventListener("click", (e) => { if (e.target.closest("a")) $("#stepper").classList.remove("open"); });
    if (state.student) { Py.warmUp(); Api.warmUp(); }
    onRoute();
  }

  return { init, state: () => state };
})();

document.addEventListener("DOMContentLoaded", App.init);
