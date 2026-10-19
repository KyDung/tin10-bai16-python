// ★ ĐỔI MỖI BÀI: Hoạt động 1 – KHỞI ĐỘNG (Hình 16.1: so sánh ngôn ngữ máy, hợp ngữ và Python).
// Mục đích: học sinh tự cảm nhận "ngôn ngữ nào dễ hiểu nhất" -> tạo nhu cầu tìm hiểu ngôn ngữ bậc cao.
const Intro = (() => {
  const MACHINE = [
    "01101101 01101001 01101110 00100000",
    "01101110 00100000 01110100 01110010",
    "11100001 10111010 10100001 01101110",
    "10100101 01110100 00100000 11000100",
    "00100000 01110100 01110010 01100001"
  ].join("\n");

  const ASM = [
    "RESETA  EQU  %00010011",
    "CTLREG  EQU  %00010001",
    "INITA   LDA A  #RESETA",
    "        STA A  ACIA",
    "        LDA A  #CTLREG",
    "        STA A  ACIA",
    "        JMP    SIGNON"
  ].join("\n");

  const PY = [
    "# Nhập từ bàn phím dãy n số và tính tổng.",
    'n = int(input("Nhập số tự nhiên n: "))',
    "S = 0",
    "for i in range(n):",
    '    a = int(input("Nhập số thứ " + str(i+1) + ": "))',
    "    S = S + a",
    'print("Tổng các số đã nhập là:", S)'
  ].join("\n");

  const CARDS = [
    { id: "machine", label: "Đoạn 1", name: "Ngôn ngữ máy", html: `<span class="bin">${Util.esc(MACHINE)}</span>` },
    { id: "asm", label: "Đoạn 2", name: "Hợp ngữ (Assembly)", html: `<span class="asm">${Util.esc(ASM)}</span>` },
    { id: "python", label: "Đoạn 3", name: "Python", html: Util.highlight(PY) }
  ];

  const parse = (s) => {
    const o = {};
    String(s || "").split("\n").forEach((l) => { const i = l.indexOf("="); if (i > 0) o[l.slice(0, i)] = l.slice(i + 1); });
    return o;
  };

  function validate(choice, reason) {
    return Validators.result([
      Validators.chk(!!choice, "Đã chọn một đoạn", "Em hãy nháy chọn một trong ba đoạn chương trình nhé."),
      Validators.chk(choice === "python", "Chọn đoạn dễ hiểu nhất",
        "Em thử đọc kĩ từng đoạn và đoán xem nó đang bảo máy tính làm gì. Đoạn nào em đoán được nhiều nhất mà không cần ai dịch hộ?"),
      Validators.chk(Util.norm(reason).length >= 8, "Có giải thích lí do", "Em viết thêm một câu ngắn giải thích vì sao em chọn như vậy nhé.")
    ]);
  }

  function mount(box, ctx, rec, stats) {
    const saved = parse(rec.studentCode);
    let choice = saved.choice || "";
    box.innerHTML = `<div class="task task-intro">
      <div class="task-text"><p>Hình 16.1 cho thấy <b>ba đoạn chương trình</b> viết bằng ba ngôn ngữ lập trình khác nhau. Em hãy quan sát và nháy chọn đoạn có <b>câu lệnh dễ hiểu nhất</b> với em.</p></div>
      <div class="cards3" role="radiogroup" aria-label="Chọn đoạn chương trình dễ hiểu nhất">${CARDS.map((c) =>
        `<button type="button" class="code-card" role="radio" aria-checked="false" data-id="${c.id}">
           <span class="cc-head"><b>${c.label}</b><em>${c.name}</em></span>
           <pre class="cc-code">${c.html}</pre>
           <span class="cc-pick">✓ Em chọn đoạn này</span></button>`).join("")}</div>
      <p class="fig-cap">Hình 16.1. Cùng một việc nhưng viết bằng các ngôn ngữ lập trình khác nhau.</p>
      <label class="reason"><span>Vì sao em chọn như vậy?</span>
        <textarea class="reason-in" rows="2" placeholder="Em viết 1–2 câu…" spellcheck="false"></textarea></label>
      <div class="fb" role="status" hidden></div>
      <div class="task-actions"><button type="button" class="btn btn-primary" data-check>TRẢ LỜI</button></div></div>`;
    const fb = box.querySelector(".fb"), reasonEl = box.querySelector(".reason-in");
    reasonEl.value = saved.reason || "";
    Activity.guardInput(reasonEl, stats);

    function paint() {
      box.querySelectorAll(".code-card").forEach((b) => {
        const on = b.dataset.id === choice;
        b.classList.toggle("on", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
    }
    box.querySelectorAll(".code-card").forEach((b) => b.addEventListener("click", () => { choice = b.dataset.id; paint(); }));
    paint();
    if (rec.passed) Activity.showFb(fb, "ok", `<strong>Chính xác!</strong> ${def.success}`);

    box.querySelector("[data-check]").onclick = () => {
      const res = validate(choice, reasonEl.value);
      rec.attempts++;
      rec.studentCode = `choice=${choice}\nreason=${reasonEl.value.trim().replace(/\n/g, " ")}`;
      if (res.passed) {
        Activity.showFb(fb, "ok", `<strong>Chính xác!</strong> ${def.success}`);
        if (!rec.passed) { rec.passed = true; rec.completedAt = Util.nowISO(); }
        ctx.save(); ctx.onPass();
      } else {
        Activity.showFb(fb, "warn", `<strong>Chưa đúng rồi.</strong> Em thử lại nhé!<ul class="hints">${res.errors.slice(0, 1).map((h) => `<li>${Util.esc(h)}</li>`).join("")}</ul>`);
        ctx.save();
      }
    };
    return { destroy() {} };
  }

  const def = {
    id: "khoi-dong", name: "Câu lệnh nào dễ hiểu nhất?", title: "Khởi động: câu lệnh nào dễ hiểu nhất?", icon: "🚀", kind: "custom",
    lead: "Máy tính chỉ hiểu các dãy số 0 và 1, nhưng con người thì không! Vì vậy người ta đã sáng tạo ra nhiều loại ngôn ngữ lập trình khác nhau.",
    mount,
    success: "Đúng như vậy: các câu lệnh của Python gần với tiếng Anh và cách ta nói hằng ngày (<code>input</code> = nhập vào, <code>print</code> = in ra, <code>for</code> = lặp lại…) nên dễ đọc, dễ hiểu hơn hẳn dãy 0 và 1. Những ngôn ngữ như vậy gọi là <b>ngôn ngữ lập trình bậc cao</b> – cùng khám phá ở phần tiếp theo."
  };

  return { def };
})();
