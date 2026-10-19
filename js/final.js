// ★ ĐỔI MỖI BÀI: Hoạt động 4 – VẬN DỤNG (một chương trình gộp hai yêu cầu trong mục VẬN DỤNG của sách).
// Đề có cấu trúc, KHÔNG có chương trình mẫu đầy đủ. Checklist đổi theo thời gian thực; nút nộp chỉ hết khóa khi đạt yêu cầu tối thiểu.
// Web không chấm nội dung cá nhân; chỉ kiểm tra các yêu cầu khách quan.
const Final = (() => {
  const TASK_HTML = `
    <div class="callout"><p><b>Em hãy viết MỘT chương trình Python</b> (tên tệp <code>Bai16_vandung.py</code>) gồm <b>3 phần, theo đúng thứ tự từ trên xuống dưới</b>:</p></div>
    <div class="final-parts">
      <section class="fpart"><h4><span>1</span> Dòng đầu tiên: chú thích</h4>
        <p>Dòng đầu tiên của chương trình là <b>một dòng chú thích</b>, bắt đầu bằng dấu <code>#</code>, nêu chương trình làm gì (em tự viết nội dung).</p></section>
      <section class="fpart"><h4><span>2</span> In bài thơ trên 4 dòng</h4>
        <p>Dùng lệnh <code>print</code> với xâu kí tự đặt giữa <b>cặp ba dấu nháy kép</b> (<code>"""</code> … <code>"""</code>) để in ra màn hình đúng bài thơ sau, mỗi câu một dòng:</p>
        <blockquote class="poem">Không có việc gì khó<br>Chỉ sợ lòng không bền<br>Đào núi và lấp biển<br>Quyết chí ắt làm nên</blockquote>
        <p class="small">Gợi ý: trong cặp ba dấu nháy kép, em được nhấn <kbd>Enter</kbd> để xuống dòng.</p></section>
      <section class="fpart"><h4><span>3</span> In bảng nhân của một số</h4>
        <p>Chọn <b>một số bất kì từ 1 đến 10</b> (ví dụ số 7) và in bảng nhân của số đó: <b>đủ 10 dòng</b>, từ nhân với 1 đến nhân với 10. Mỗi dòng gồm phép nhân và kết quả, ví dụ với số 7:</p>
        <pre class="sample">7 x 1 = 7
7 x 2 = 14
...
7 x 10 = 70</pre>
        <details class="hint-box"><summary>💡 Gợi ý</summary>
          <p>Mỗi dòng của bảng nhân có thể in bằng một lệnh <code>print</code>, vừa in chữ vừa in kết quả phép tính, giống Ví dụ 3 trong bài. Em viết 10 lệnh <code>print</code> như vậy, mỗi lệnh một dòng.</p></details></section>
    </div>`;

  // mode 'static': kiểm tra ngay khi gõ; mode 'run': cần kết quả chạy.
  const firstLine = (code) => String(code || "").split("\n").find((l) => l.trim() !== "") || "";
  const REQS = [
    { id: "comment", mode: "static", required: true, label: "Dòng đầu tiên là chú thích bắt đầu bằng dấu #", hint: "Dòng đầu tiên của chương trình phải là một dòng chú thích bắt đầu bằng dấu # (có nội dung sau dấu #).",
      test: (code) => /^\s*#\s*\S+/.test(firstLine(code)) },
    { id: "tripleQuote", mode: "static", required: true, label: "Dùng cặp ba dấu nháy kép để in bài thơ", hint: "Hãy đặt bài thơ giữa cặp ba dấu nháy kép \"\"\" … \"\"\" trong lệnh print.",
      test: (code) => /"""[\s\S]*?"""/.test(code) },
    { id: "runs", mode: "run", required: true, label: "Chương trình chạy không báo lỗi", hint: "Chương trình đang báo lỗi. Đọc thông báo đỏ ở khung kết quả rồi sửa.",
      test: (code, run) => !run.err },
    { id: "poem", mode: "run", required: true, label: "In đủ 4 dòng bài thơ, đúng thứ tự", hint: "Bài thơ in ra chưa đủ hoặc chưa đúng 4 dòng. Kiểm tra từng chữ (có dấu) và việc xuống dòng.",
      test: (code, run) => Validators.poemPrinted(run.out) },
    { id: "table", mode: "run", required: true, label: "In đủ bảng nhân của một số (10 dòng, nhân với 1 đến 10)", hint: "Chưa thấy đủ 10 phép nhân của cùng một số. Mỗi dòng cần có phép nhân và kết quả, ví dụ: 7 x 3 = 21.",
      test: (code, run) => Validators.multiplicationTables(run.out).full.length >= 1 }
  ];

  // Trả về { checks:[{id,ok,label,hint,pending}], requirements:{id:ok}, passed }
  function evaluate(code, run) {
    const checks = REQS.map((r) => {
      let ok = false, pending = false;
      if (r.mode === "static") ok = !!r.test(code);
      else if (run) ok = !!r.test(code, run);
      else pending = true;
      return { id: r.id, ok, pending, required: r.required, label: r.label, hint: r.hint };
    });
    const requirements = {};
    checks.forEach((c) => { requirements[c.id] = c.ok; });
    const passed = checks.filter((c) => c.required).every((c) => c.ok);
    return { checks, requirements, passed };
  }

  return {
    def: { id: "final-vandung", name: "Vận dụng: bài thơ và bảng nhân", title: "Vận dụng: bài thơ và bảng nhân", icon: "🌟", fileName: "Bai16_vandung.py", rows: 12 },
    TASK_HTML, REQS, evaluate
  };
})();
