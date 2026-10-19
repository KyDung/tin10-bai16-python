// ★ ĐỔI MỖI BÀI: Hoạt động 2 – HÌNH THÀNH KIẾN THỨC (5 hoạt động nhỏ, làm tuần tự).
// Mỗi hoạt động: giới thiệu + ví dụ (xem mẫu) -> học sinh TỰ GÕ / TỰ TRẢ LỜI -> KIỂM TRA -> ghi nhớ.
const Learning = (() => {
  const { chk, result } = Validators;

  // Khối "màn hình IDLE" tĩnh để minh họa ví dụ trong sách. items: [["in","5"],["out","5"],["err","..."]]
  function transcript(items, title) {
    const body = items.map(([t, s]) =>
      t === "in" ? `<div class="sh-line sh-in"><span class="sh-p">&gt;&gt;&gt; </span>${Util.highlight(s)}</div>`
        : `<div class="sh-line ${t === "err" ? "sh-err" : "sh-out"}">${Util.esc(s)}</div>`).join("");
    return `<div class="win win-shell static" oncopy="return false">${Win.titleBar(title || "IDLE Shell 3.12.1")}${Win.menuBar(["File", "Edit", "Shell", "Debug", "Options", "Window", "Help"])}<div class="sh-body"><div class="sh-log">${body}</div></div></div>`;
  }
  const cmd = (text, expl, hint) => ({ type: "command", text: "Gõ lệnh sau (nhấn Enter khi xong):", expect: [text], show: text, explain: expl, hint });

  // ------------------------------------------------------------ 1. Ngôn ngữ lập trình bậc cao
  const A1 = {
    id: "learn-bac-cao", name: "Ngôn ngữ lập trình bậc cao", title: "Ngôn ngữ lập trình bậc cao và Python", icon: "📚", kind: "fill",
    lead: "Hoạt động 1: Tìm hiểu ngôn ngữ lập trình bậc cao.",
    intro: `
      <div class="callout think"><b>💭 Em thử nghĩ:</b> (1) Ngôn ngữ lập trình là gì? Có những loại nào? (2) Em hãy kể tên vài ngôn ngữ lập trình bậc cao mà em biết.
        <details><summary>Xem gợi ý</summary><p><b>Ngôn ngữ lập trình</b> là ngôn ngữ dùng để viết chương trình cho máy tính. Có ba loại: <b>ngôn ngữ máy</b>, <b>hợp ngữ</b> và <b>ngôn ngữ lập trình bậc cao</b>.</p></details></div>

      <h3>Ba “bậc thang” của ngôn ngữ lập trình</h3>
      <p>Ngôn ngữ máy (mã nhị phân) và hợp ngữ (các từ viết tắt tiếng Anh) rất khó viết, khó hiểu. Khó khăn đó giảm đi nhiều khi lập trình bằng <b>ngôn ngữ bậc cao</b>, vì các câu lệnh được viết <b>gần với ngôn ngữ tự nhiên</b>.</p>
      <div class="ladder" role="img" aria-label="Ba bậc: ngôn ngữ máy, hợp ngữ, ngôn ngữ bậc cao; càng lên cao càng dễ đọc, dễ viết">
        <div class="rung r3"><b>Ngôn ngữ lập trình bậc cao</b><span>Python, Java, C/C++… câu lệnh gần ngôn ngữ tự nhiên</span><code>print("Xin chào")</code></div>
        <div class="rung r2"><b>Hợp ngữ</b><span>Dùng các từ viết tắt (thường là tiếng Anh)</span><code>LDA A #RESETA</code></div>
        <div class="rung r1"><b>Ngôn ngữ máy</b><span>Mã nhị phân 0 và 1 – máy tính hiểu trực tiếp</span><code>01101101 01101001</code></div>
        <div class="ladder-axis"><span>Khó đọc, khó viết</span><i>→</i><span>Dễ đọc, dễ viết</span></div>
      </div>

      <h3>Máy tính hiểu chương trình bậc cao bằng cách nào?</h3>
      <p>Máy tính chỉ thực hiện được ngôn ngữ máy. Vì vậy chương trình bậc cao phải được <b>dịch</b> sang ngôn ngữ máy nhờ một chương trình chuyên dụng gọi là <b>chương trình dịch</b>.</p>
      <div class="flow" role="img" aria-label="Chương trình bậc cao, qua chương trình dịch, thành ngôn ngữ máy, rồi máy tính thực hiện">
        <div class="fl-box"><small>Chương trình bậc cao</small><code>print("Xin chào")</code></div>
        <div class="fl-arrow"><span>⚙️ Chương trình dịch</span><b class="ar">➜</b></div>
        <div class="fl-box"><small>Ngôn ngữ máy</small><code>0110 1101 …</code></div>
        <div class="fl-arrow"><b class="ar">➜</b></div>
        <div class="fl-box"><small>Máy tính thực hiện</small><span class="fl-pc">🖥️</span></div>
      </div>

      <h3>Một số ngôn ngữ lập trình bậc cao thông dụng</h3>
      <div class="langs">
        <div class="lang"><img src="images/python-logo.svg" alt="Logo Python" width="56" height="56" loading="lazy"><b>Python</b></div>
        <div class="lang"><span class="java-badge" aria-hidden="true">☕</span><b>Java</b></div>
        <div class="lang"><img src="images/cpp-logo.svg" alt="Logo C++" width="56" height="56" loading="lazy"><b>C / C++</b></div>
        <div class="lang"><img src="images/js-logo.svg" alt="Logo JavaScript" width="56" height="56" loading="lazy"><b>JavaScript</b></div>
      </div>

      <h3>Python – ngôn ngữ bậc cao phổ biến trong nghiên cứu và giáo dục</h3>
      <div class="person">
        <figure><img src="images/guido-van-rossum.jpg" alt="Chân dung Guido van Rossum, người tạo ra ngôn ngữ Python" width="320" height="213" loading="lazy">
          <figcaption><b>Guido van Rossum</b> (người Hà Lan)<br><small>Ảnh: Daniel Stroud, CC BY-SA 4.0, Wikimedia Commons</small></figcaption></figure>
        <ul class="facts">
          <li>🗓️ <b>Ra mắt lần đầu năm 1991</b> do Guido van Rossum tạo ra.</li>
          <li>✍️ Câu lệnh có <b>cú pháp đơn giản</b>, môi trường lập trình dễ sử dụng.</li>
          <li>💻 <b>Không phụ thuộc hệ điều hành</b>: chạy trên nhiều loại máy tính, điện thoại thông minh, robot giáo dục…</li>
          <li>🌐 Có <b>mã nguồn mở</b> nên nhiều nhà khoa học cùng phát triển; thư viện phong phú về trí tuệ nhân tạo, phân tích dữ liệu, kĩ thuật robot…</li>
        </ul>
      </div>`,
    task: "<p><b>Điền vào chỗ trống</b> để hoàn thành các câu sau (em đọc lại phần giới thiệu ở trên nếu cần).</p>",
    blanks: [
      { id: "b1", before: "Câu lệnh của ngôn ngữ bậc cao được viết gần với ", after: ", nên rất dễ đọc, dễ hiểu.", placeholder: "gõ vào đây", size: 18,
        accept: [/ngon ngu tu nhien/], label: "Gần với ngôn ngữ nào", hint: "Xem lại khung “bậc thang”: bậc cao nhất gần với loại ngôn ngữ nào của con người?" },
      { id: "b2", before: "Chương trình bậc cao phải nhờ chương trình ", after: " chuyển sang ngôn ngữ máy thì máy tính mới thực hiện được.", placeholder: "tên chương trình", size: 12,
        accept: [/\bdich\b/], label: "Tên chương trình chuyển đổi", hint: "Xem lại sơ đồ có mũi tên: chương trình nào đứng giữa chương trình bậc cao và ngôn ngữ máy?" },
      { id: "b3", before: "Python do ", after: " (người Hà Lan) tạo ra", placeholder: "họ tên", size: 18,
        accept: [/guido|rossum/], label: "Người tạo ra Python", hint: "Tên người tạo ra Python nằm cạnh bức ảnh chân dung ở phần giới thiệu Python." },
      { id: "b4", before: "và ra mắt lần đầu vào năm ", after: ".", placeholder: "năm", size: 6,
        accept: ["1991"], label: "Năm ra mắt", hint: "Năm ra mắt ghi ở dòng đầu tiên trong danh sách đặc điểm của Python." },
      { id: "b5", before: "Một ngôn ngữ bậc cao khác (không phải Python) mà em biết là: ", after: "", placeholder: "ví dụ…", size: 18,
        accept: [/(^|[\s,;./])(java|javascript|js|pascal|php|ruby|kotlin|swift|golang|go|rust|basic|c\+\+|c#|c)($|[\s,;./])/], label: "Kể tên ngôn ngữ bậc cao khác",
        hint: "Em kể tên một ngôn ngữ lập trình bậc cao khác Python. Phần “Một số ngôn ngữ lập trình bậc cao thông dụng” có gợi ý đấy." }
    ],
    success: "Em đã nắm được ngôn ngữ lập trình bậc cao là gì.",
    recap: `<ul><li>Ngôn ngữ lập trình bậc cao có các câu lệnh viết gần với ngôn ngữ tự nhiên nên đọc và hiểu chương trình dễ hơn.</li><li>Chương trình bậc cao cần được <b>chương trình dịch</b> chuyển sang ngôn ngữ máy.</li><li>Python là ngôn ngữ lập trình bậc cao phổ biến trong nghiên cứu và giáo dục.</li></ul>`
  };

  // ------------------------------------------------------------ 2. Môi trường lập trình Python
  const A2 = {
    id: "learn-moi-truong", name: "Môi trường lập trình Python", title: "Môi trường lập trình Python và hai chế độ làm việc", icon: "🖥️", kind: "steps", withEditor: true, fileName: "Bai.py",
    lead: "Hoạt động 2: Làm quen với môi trường lập trình Python.",
    intro: `
      <p>Sau khi khởi động, màn hình làm việc của Python (IDLE) có dạng như sau:</p>
      <div class="fig">${transcript([["out", "Python 3.12.1 (tags/v3.12.1:2305ca5, Dec  7 2023) [MSC v.1937 64 bit (AMD64)] on win32"], ["out", 'Type "help", "copyright", "credits" or "license()" for more information.'], ["in", ""]], "IDLE Shell 3.12.1")}
        <div class="legend"><span><i>①</i> Dấu nhắc của Python là <code>&gt;&gt;&gt;</code></span><span><i>②</i> Nơi gõ lệnh; gõ xong nhấn <kbd>Enter</kbd> để thực hiện</span></div>
        <p class="fig-cap">Hình 16.2. Màn hình làm việc của Python.</p></div>
      <p>Môi trường lập trình Python cho phép soạn thảo, gỡ lỗi, phân tích cú pháp và thực hiện chương trình (cả chương trình hoàn chỉnh hoặc từng câu lệnh). Nó có <b>hai chế độ</b>:</p>
      <div class="modes">
        <div class="mode m1"><h4>⌨️ Chế độ gõ lệnh trực tiếp</h4>
          <ul><li>Gõ lệnh ngay sau dấu nhắc <code>&gt;&gt;&gt;</code></li><li>Nhấn <kbd>Enter</kbd> → lệnh được thực hiện <b>ngay</b></li><li>Dùng để <b>tính toán, kiểm tra nhanh</b> một lệnh</li></ul></div>
        <div class="mode m2"><h4>📝 Chế độ soạn thảo</h4>
          <ul><li>Chọn <b>File → New File</b> để mở cửa sổ soạn thảo</li><li>Viết <b>mỗi lệnh trên một dòng</b>, lưu tệp, rồi chọn <b>Run</b> (phím <kbd>F5</kbd>)</li><li>Dùng để viết <b>chương trình có nhiều dòng lệnh</b></li></ul></div>
      </div>
      <p class="note">📌 <b>Chú ý.</b> Ngoài IDLE, người ta còn soạn thảo chương trình Python bằng các phần mềm như Thonny, PyCharm, Visual Studio, Wingware…</p>
      <p>Em hãy thử cả hai chế độ: gõ lệnh trực tiếp trong cửa sổ Shell, rồi viết một chương trình trong khung soạn thảo, và trả lời các câu hỏi theo từng bước.</p>`,
    steps: [
      cmd("2 + 3", "Kết quả hiện ngay sau khi nhấn Enter – đó là đặc điểm của <b>chế độ gõ lệnh trực tiếp</b>: gõ một lệnh, có kết quả ngay."),
      { type: "program", text: "<b>Chế độ soạn thảo:</b> trong khung soạn thảo bên cạnh, gõ chương trình gồm <b>2 dòng lệnh</b> sau (mỗi lệnh một dòng), rồi bấm <b>Chạy chương trình</b> (hoặc nhấn F5):",
        show: 'print("Xin chào")\nprint(5 + 2*7)',
        check(code, run) {
          const body = Validators.stripComments(code);
          const lines = Validators.outLines(run.out).map(Validators.squash);
          return [
            chk(!run.err, "Chương trình chạy không báo lỗi", "Chương trình báo lỗi. Em đối chiếu từng dấu ngoặc, dấu nháy với chương trình mẫu."),
            chk((body.match(/print\s*\(/g) || []).length >= 2, "Có 2 lệnh print, mỗi lệnh một dòng", "Em gõ đủ 2 lệnh print, mỗi lệnh trên một dòng riêng."),
            chk(lines.length === 2 && lines[0] === "xinchào" && lines[1] === "19", "Kết quả in ra đúng", "Kết quả chưa như mẫu. Em kiểm tra lại nội dung trong từng lệnh print.")
          ];
        },
        explain: "Khác với chế độ gõ lệnh trực tiếp, chương trình gồm nhiều dòng được thực hiện <b>cùng một lúc</b> khi em chạy cả chương trình." },
      { type: "answer", text: "Chế độ nào dùng để viết chương trình có <b>nhiều dòng lệnh</b>? (gõ: gõ lệnh trực tiếp hoặc soạn thảo)", placeholder: "tên chế độ", accept: [/soan thao/],
        hint: "Em vừa làm hai chế độ ở bước 1 và 2: chương trình nhiều dòng được viết ở chế độ nào?" },
      { type: "answer", text: "Ở chế độ gõ lệnh trực tiếp, lệnh được thực hiện khi em nhấn phím nào?", placeholder: "tên phím", accept: [/^enter$|phim enter/],
        hint: "Em vừa làm ở bước 1: sau khi gõ <code>2 + 3</code> em nhấn phím nào để có kết quả?" },
      { type: "answer", text: "Ở chế độ soạn thảo, em nhấn phím nào để <b>chạy</b> chương trình? (xem ở bước 2)", placeholder: "tên phím", accept: [/^f5$|run module/],
        hint: "Em đọc lại đề bước 2: có nhắc tới một phím để chạy chương trình." }
    ],
    success: "Em đã phân biệt được hai chế độ làm việc của Python.",
    recap: `<ul><li><b>Chế độ gõ lệnh trực tiếp</b>: gõ lệnh sau dấu nhắc <code>&gt;&gt;&gt;</code> rồi nhấn Enter – lệnh được thực hiện ngay, dùng để tính toán, kiểm tra nhanh.</li><li><b>Chế độ soạn thảo</b>: viết chương trình nhiều dòng (File → New File), lưu tệp rồi chạy (Run/F5).</li></ul>`
  };

  // ------------------------------------------------------------ 3. Giá trị, kiểu dữ liệu, phép toán
  const A3 = {
    id: "learn-gia-tri", name: "Kiểu dữ liệu và phép toán", title: "Các lệnh đầu tiên: kiểu dữ liệu và phép toán", icon: "🔢", kind: "steps",
    lead: "Hoạt động 3 (phần 1): Làm quen với câu lệnh của Python trong chế độ gõ lệnh trực tiếp.",
    intro: `
      <h3>Ví dụ 1. Các lệnh đầu tiên</h3>
      <div class="split">
        <div class="fig">${transcript([["in", "5"], ["out", "5"], ["in", "2.6"], ["out", "2.6"], ["in", '"học sinh lớp 10"'], ["out", "'học sinh lớp 10'"]])}</div>
        <table class="mini"><thead><tr><th>Em gõ</th><th>Python hiểu là</th></tr></thead><tbody>
          <tr><td><code>5</code></td><td><b>số nguyên</b> (int)</td></tr>
          <tr><td><code>2.6</code></td><td><b>số thực</b> (float) – có dấu chấm thập phân</td></tr>
          <tr><td><code>"học sinh lớp 10"</code></td><td><b>xâu kí tự</b> (str) – chữ đặt trong cặp dấu nháy</td></tr></tbody></table>
      </div>
      <p>Python <b>tự nhận biết kiểu dữ liệu</b> và thực hiện phép toán ngay trên dòng lệnh.</p>
      <h3>Ví dụ 2. Các lệnh với phép toán</h3>
      <div class="split">
        <div class="fig">${transcript([["in", "3 + 7"], ["out", "10"], ["in", "12*5"], ["out", "60"]])}</div>
        <table class="mini"><thead><tr><th>Phép toán</th><th>Kí hiệu</th></tr></thead><tbody>
          <tr><td>Cộng</td><td><code>+</code></td></tr><tr><td>Trừ</td><td><code>-</code></td></tr>
          <tr><td>Nhân</td><td><code>*</code> (dấu sao, không phải chữ x)</td></tr><tr><td>Chia</td><td><code>/</code></td></tr></tbody></table>
      </div>
      <p>Bây giờ đến lượt em! Gõ lần lượt các lệnh vào cửa sổ Shell (em được xem mẫu nhưng phải tự gõ, không dán được).</p>`,
    steps: [
      cmd("5", "Python hiểu 5 là một <b>số nguyên</b>."),
      cmd("2.6", "Có dấu chấm thập phân nên Python hiểu đây là <b>số thực</b>."),
      cmd('"học sinh lớp 10"', "Python in lại chữ trong cặp dấu nháy: đây là <b>xâu kí tự</b>, không phải số."),
      cmd("3 + 7", "Python tính ngay và trả về 10."),
      cmd("12*5", "Dấu nhân trong Python là <code>*</code>. Dấu chia là <code>/</code>."),
      { type: "answer", text: "Python nhận ra <code>2.6</code> thuộc kiểu dữ liệu nào? (số nguyên, số thực hay xâu kí tự)", placeholder: "kiểu dữ liệu", accept: [/so thuc|float/],
        hint: "Xem lại bảng “Python hiểu là”: số có dấu chấm thập phân thuộc kiểu nào?" },
      { type: "answer", text: "<b>Dự đoán rồi kiểm chứng:</b> lệnh <code>5/2</code> cho kết quả là bao nhiêu? (em có thể gõ thử trong Shell)", placeholder: "kết quả", accept: ["2.5"],
        hint: "Phép chia <code>/</code> trong Python cho kết quả là số thực. Em gõ <code>5/2</code> vào Shell để xem rồi điền kết quả." },
      { type: "answer", text: "Kết quả của <code>12 + 1.5</code> thuộc kiểu dữ liệu nào? (số nguyên hay số thực)", placeholder: "kiểu dữ liệu", accept: [/so thuc|float/],
        hint: "Em thử gõ <code>12 + 1.5</code> trong Shell: kết quả có dấu chấm thập phân hay không?" },
      { type: "answer", text: "Kết quả của <code>10 + 7/2</code> là bao nhiêu? (Chú ý Python làm phép chia trước phép cộng)", placeholder: "kết quả", accept: ["13.5"],
        hint: "Em gõ thử <code>10 + 7/2</code> vào Shell rồi chép lại kết quả nhé." }
    ],
    success: "Em đã biết Python nhận biết kiểu dữ liệu và tính toán các phép toán cơ bản.",
    recap: `<ul><li>Khi nhập số hoặc xâu kí tự, Python <b>tự nhận biết kiểu dữ liệu</b>: số nguyên, số thực, xâu kí tự (đặt trong dấu nháy).</li><li>Các phép toán thông thường: <code>+</code> <code>-</code> <code>*</code> <code>/</code>; Python phân biệt số nguyên và số thực (ví dụ <code>5/2</code> cho kết quả <code>2.5</code>).</li></ul>`
  };

  // ------------------------------------------------------------ 4. Lệnh print()
  const A4 = {
    id: "learn-print", name: "Lệnh print()", title: "Lệnh print() – đưa dữ liệu ra màn hình", icon: "🖨️", kind: "steps",
    lead: "Hoạt động 3 (phần 2): Lệnh print() có chức năng đưa dữ liệu ra (xuất dữ liệu), mặc định là in ra màn hình.",
    intro: `
      <h3>Ví dụ 3. Lệnh print()</h3>
      <div class="fig">${transcript([["in", "print(12)"], ["out", "12"], ["in", 'print(10, 3.4 + 4.1, "hoà bình")'], ["out", "10 7.5 hoà bình"],
        ["in", 'print("Dãy ba số chẵn:", 2, 4, 6)'], ["out", "Dãy ba số chẵn: 2 4 6"], ["in", 'print("3 + 7 =", 3+7)'], ["out", "3 + 7 = 10"]])}</div>
      <div class="syntax"><div class="syntax-title">Cú pháp lệnh print()</div><code class="syntax-code">print(v1, v2, ..., vn)</code>
        <p>trong đó <code>v1, v2, ..., vn</code> là các giá trị cần đưa ra màn hình.</p></div>
      <ul class="facts">
        <li>Lệnh <code>print()</code> in ra <b>một hoặc nhiều</b> giá trị; các giá trị được in <b>trên một dòng</b>, giữa chúng có <b>dấu cách</b>.</li>
        <li><code>print()</code> còn <b>tính toán</b> và đưa ra kết quả của biểu thức (ví dụ <code>3+7</code> → <code>10</code>).</li>
      </ul>
      <p>Em hãy tự gõ lại các lệnh trong Ví dụ 3, rồi thử lệnh ở Câu hỏi 2 của sách.</p>`,
    steps: [
      cmd("print(12)", "Lệnh <code>print</code> đưa giá trị 12 ra màn hình."),
      cmd('print(10, 3.4 + 4.1, "hoà bình")', "Ba giá trị được in trên một dòng, cách nhau một dấu cách; <code>3.4 + 4.1</code> được tính thành 7.5."),
      cmd('print("Dãy ba số chẵn:", 2, 4, 6)', "Xâu kí tự đặt trong dấu nháy được in nguyên văn, các số đi theo sau."),
      cmd('print("3 + 7 =", 3+7)', "Chữ <code>3 + 7 =</code> được in nguyên văn còn <code>3+7</code> được Python tính thành 10."),
      cmd('print("13 + 10*3/2 - 3*2 = ", 13 + 10*3/2 - 3*2)', "Python tính biểu thức theo thứ tự ưu tiên: nhân/chia trước, cộng/trừ sau."),
      { type: "answer", text: "Lệnh ở bước 5 in ra giá trị nào ở <b>cuối dòng</b>? (em nhìn kết quả trong Shell và chép lại)", placeholder: "giá trị", accept: ["22.0"],
        hint: "Em đọc kĩ kết quả trong Shell. Chú ý: vì có phép chia <code>/</code> nên kết quả là số thực, có dấu chấm thập phân." },
      { type: "answer", text: "Khi in nhiều giá trị bằng một lệnh <code>print</code>, giữa các giá trị mặc định được ngăn cách bởi gì? (dấu cách, dấu phẩy hay dấu chấm)", placeholder: "kí tự ngăn cách", accept: [/dau cach|khoang trang|khoang cach|space/],
        hint: "Em nhìn dòng <code>10 7.5 hoà bình</code> ở Ví dụ 3: giữa các giá trị là kí tự nào?" }
    ],
    success: "Em đã biết dùng lệnh print() để đưa dữ liệu ra màn hình.",
    recap: `<ul><li>Cú pháp: <code>print(v1, v2, ..., vn)</code> – in một hoặc nhiều giá trị ra màn hình, cách nhau bởi dấu cách.</li><li><code>print()</code> có thể tính toán và đưa ra kết quả của biểu thức.</li></ul>`
  };

  // ------------------------------------------------------------ 5. Thực hành: Bai1.py
  const SAMPLE = '# Chương trình đầu tiên\nprint("Xin chào!")';
  const A5 = {
    id: "learn-thuc-hanh", name: "Thực hành: chương trình đầu tiên", title: "Thực hành: tạo và chạy chương trình Bai1.py", icon: "🚀", kind: "idle",
    lead: "Nhiệm vụ: dùng chế độ soạn thảo chương trình của Python để tạo, nhập và chạy chương trình đầu tiên có tên Bai1.py.",
    intro: `<p class="note">📌 Kí hiệu <code>#</code> đánh dấu <b>dòng chú thích</b>: Python bỏ qua dòng này, nó chỉ để giúp người đọc hiểu chương trình.</p>
      <p>Em làm lần lượt <b>5 bước</b> trong cột bên trái, ngay trong màn hình IDLE mô phỏng bên phải. Mỗi bước hoàn thành sẽ được đánh dấu ✓.</p>`,
    fileName: "Bai1.py",
    sample: SAMPLE,
    expectOut: "Xin chào!",
    guide: [
      { k: "open", n: 1, text: "<b>Khởi động Python:</b> nháy đúp chuột vào biểu tượng IDLE (Python) trên màn hình." },
      { k: "newFile", n: 2, text: "<b>Chọn chế độ soạn thảo:</b> trong cửa sổ IDLE Shell, chọn <b>File → New File</b>." },
      { k: "typed", n: 3, text: "<b>Nhập chương trình:</b> gõ nội dung như chương trình mẫu (gồm dòng chú thích và lệnh <code>print</code>)." },
      { k: "save", n: 4, text: "<b>Lưu tệp:</b> chọn <b>File → Save</b> hoặc nhấn <kbd>Ctrl</kbd>+<kbd>S</kbd>, đặt tên tệp là <b>Bai1.py</b>." },
      { k: "run", n: 5, text: "<b>Chạy chương trình:</b> chọn <b>Run → Run Module</b> hoặc nhấn <kbd>F5</kbd>. Kết quả hiện trong cửa sổ Shell." }
    ],
    checkCode(code) {
      const body = Util.normCode(Validators.stripComments(code));
      return result([
        chk(Validators.hasComment(code), "Có dòng chú thích bắt đầu bằng #", "Dòng đầu tiên là chú thích, bắt đầu bằng dấu # (như chương trình mẫu)."),
        chk(body.includes('print("xinchao!")'), "Có lệnh print(\"Xin chào!\")", "Kiểm tra lệnh print: tên lệnh, dấu ngoặc, dấu nháy và dòng chữ Xin chào! phải giống chương trình mẫu.")
      ]);
    },
    success: "Em đã tạo, lưu và chạy thành công chương trình Python đầu tiên!",
    recap: `<ul><li>Các bước: <b>mở IDLE → File/New File → nhập chương trình → File/Save (Ctrl+S) → Run/Run Module (F5)</b>.</li><li>Dòng bắt đầu bằng <code>#</code> là chú thích, Python không thực hiện.</li></ul>`
  };

  const activities = [A1, A2, A3, A4, A5];
  // Danh sách "đã học" cho trang hoàn thành.
  const learned = [
    "Ngôn ngữ lập trình bậc cao là gì, chương trình dịch làm gì, Python do ai tạo ra",
    "Hai chế độ của Python: gõ lệnh trực tiếp và soạn thảo",
    "Python nhận biết kiểu dữ liệu và thực hiện các phép toán + - * /",
    "Lệnh print() để đưa dữ liệu ra màn hình",
    "Tạo, lưu và chạy chương trình Bai1.py"
  ];
  return { activities, learned };
})();
