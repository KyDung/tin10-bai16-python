// ★ ĐỔI MỖI BÀI: Hoạt động 3 – LUYỆN TẬP (3 bài lấy từ mục LUYỆN TẬP của sách).
// Chỉ có đề, KHÔNG có lệnh mẫu: học sinh tự nhớ kiến thức; validator báo cụ thể từng tiêu chí.
const Practice = (() => {
  const { chk, result } = Validators;

  // ---- Bài 1: tính giá trị biểu thức trong chế độ gõ lệnh trực tiếp
  const P1 = {
    id: "prac-bieu-thuc", name: "Tính giá trị biểu thức", title: "Bài 1. Tính giá trị biểu thức", icon: "🧮", kind: "steps", showChecks: true,
    lead: "Em hãy viết lệnh để tính giá trị các biểu thức sau trong chế độ gõ lệnh trực tiếp của Python (cửa sổ Shell bên cạnh), mỗi lệnh gõ xong nhấn Enter.",
    intro: `<p class="note">📌 Chú ý cách viết kí hiệu các phép toán trong Python. Em tự viết lệnh, bài này không có lệnh mẫu.</p>`,
    steps: [
      { type: "solve", text: "a) &nbsp;<b>10 + 13</b>", reference: "10 + 13", hint: "Kết quả chưa đúng. Em kiểm tra lại các số và dấu phép toán." },
      { type: "solve", text: "b) &nbsp;<b>20 − 7</b>", reference: "20 - 7", hint: "Kết quả chưa đúng. Phép trừ trong Python dùng dấu - (gạch ngang)." },
      { type: "solve", text: "c) &nbsp;<b>3 × 10 − 16</b>", reference: "3*10-16", hint: "Kết quả chưa đúng. Em kiểm tra kí hiệu phép nhân trong Python." },
      { type: "solve", text: "d) &nbsp;<b>12 : 5 + 13 : 6</b>", reference: "12/5 + 13/6", hint: "Kết quả chưa đúng. Em kiểm tra kí hiệu phép chia trong Python và thứ tự các phép toán." }
    ],
    success: "Em đã biết dùng chế độ gõ lệnh trực tiếp để tính biểu thức.",
    recap: `<ul><li>Cộng <code>+</code>, trừ <code>-</code>, nhân <code>*</code>, chia <code>/</code>. Phép chia cho ra số thực, ví dụ <code>12/5</code> là <code>2.4</code>.</li></ul>`
  };

  // ---- Bài 2: tìm lỗi
  const LINE2 = '"Bạn là học sinh, bạn tên là "Nguyễn Việt Anh""';
  const P2 = {
    id: "prac-tim-loi", name: "Tìm lỗi trong lệnh", title: "Bài 2. Các lệnh sau có lỗi không? Vì sao?", icon: "🐞", kind: "steps", showChecks: true,
    lead: "Em hãy lần lượt gõ hai lệnh sau vào cửa sổ Shell, quan sát kết quả rồi trả lời.",
    intro: "",
    steps: [
      { type: "command", text: "Gõ <b>lệnh 1</b> vào Shell rồi nhấn Enter:", expect: ["3 + 5"], show: "3 + 5" },
      { type: "command", text: "Gõ <b>lệnh 2</b> (gõ đúng từng dấu nháy) rồi nhấn Enter:", expect: [LINE2], show: LINE2, allowError: true,
        hint: "Em gõ lại đúng lệnh 2, chú ý các dấu nháy kép ở đầu, ở giữa và ở cuối." },
      { type: "answer", text: "Lệnh nào trong hai lệnh trên bị lỗi? (gõ 1 hoặc 2)", placeholder: "1 hoặc 2", accept: ["2"],
        hint: "Em nhìn lại kết quả trong Shell: lệnh nào làm Python báo chữ màu đỏ?" },
      { type: "answer", text: "Lệnh đó bị lỗi vì trong xâu kí tự có dấu nháy <b>loại nào</b> trùng với dấu nháy bao quanh xâu? (đơn hay kép)", placeholder: "đơn / kép", accept: [/kep/],
        hint: "Xâu được bao bằng một loại dấu nháy. Khi Python gặp lại đúng loại đó ở giữa xâu, nó hiểu xâu đã kết thúc. Em xem tên “Nguyễn Việt Anh” được đặt trong loại dấu nháy nào." },
      { type: "check", text: "<b>Sửa lỗi:</b> viết lại lệnh 2 sao cho Python không báo lỗi và vẫn hiện đủ câu <i>Bạn là học sinh, bạn tên là “Nguyễn Việt Anh”</i> (tên vẫn nằm trong dấu nháy kép).",
        check(src, res) {
          const out = Util.norm(res.out);
          return [
            chk(!res.err, "Không còn báo lỗi", "Python vẫn báo lỗi. Gợi ý: thử dùng loại dấu nháy khác để bao ngoài cả câu."),
            chk(out.includes('ban la hoc sinh, ban ten la "nguyen viet anh"'), "Hiện đủ câu, tên nằm trong dấu nháy kép", "Python chưa in ra đủ câu như đề (cả dấu nháy kép quanh tên). Em kiểm tra lại nội dung xâu.")
          ];
        }
      }
    ],
    success: "Em đã tìm ra lỗi và biết cách sửa.",
    recap: `<ul><li>Xâu kí tự đặt trong cặp dấu nháy đơn hoặc kép. Nếu bên trong xâu có dấu nháy cùng loại với dấu nháy bao ngoài thì xâu bị cắt sớm và gây lỗi cú pháp; ta đổi loại dấu nháy bao ngoài để khắc phục.</li></ul>`
  };

  // ---- Bài 3: viết lệnh in thông tin
  const P3 = {
    id: "prac-in-thong-tin", name: "Viết lệnh in thông tin", title: "Bài 3. Viết các lệnh in ra thông tin", icon: "🖨️", kind: "editor", showChecks: true,
    fileName: "Bai3.py", rows: 6, placeholder: "# Gõ chương trình của em ở đây",
    lead: "Em hãy viết chương trình gồm <b>2 lệnh print</b>, mỗi lệnh in ra <b>một dòng</b> thông tin theo yêu cầu dưới đây.",
    intro: `<div class="callout">
        <p class="req-line"><b>Dòng 1</b> in ra phép tính nhân và kết quả của nó:</p>
        <p class="req-out">1 × 3 × 5 × 7 = 105</p>
        <ul><li>Có thể viết dấu nhân là <code>x</code> hoặc <code>×</code>.</li>
          <li><b>Số 105 không được gõ sẵn trong chương trình.</b> Em hãy để <b>Python tự tính</b> tích 1 × 3 × 5 × 7 rồi in kết quả ra cùng với phần chữ.</li></ul>
        <p class="req-line"><b>Dòng 2</b> in ra đúng câu sau (đúng từng chữ, có dấu):</p>
        <p class="req-out">Bạn Hoa năm nay 16 tuổi.</p></div>`,
    validate(code, run) {
      const body = Validators.stripComments(code);
      const lines = Validators.outLines(run.out);
      return Promise.resolve(result([
        chk(!run.err, "Chương trình chạy không báo lỗi", "Chương trình đang báo lỗi. Em đọc thông báo màu đỏ ở khung kết quả rồi sửa."),
        chk((body.match(/print\s*\(/g) || []).length >= 2, "Dùng lệnh print để in ra", "Em dùng lệnh print() để đưa thông tin ra màn hình, mỗi thông tin một lệnh."),
        chk(/1\s*\*\s*3\s*\*\s*5\s*\*\s*7/.test(body) && !/105/.test(body), "Dòng 1: số 105 do Python tự tính (không gõ sẵn 105)", "Em không được gõ sẵn số 105. Hãy viết biểu thức tích 1 × 3 × 5 × 7 ngay trong lệnh print để Python tự tính và in kết quả."),
        chk(lines.length >= 1 && Validators.squash(lines[0]) === Validators.squash("1×3×5×7 = 105."), "Dòng 1 in đúng: 1 × 3 × 5 × 7 = 105", "Dòng thứ nhất chưa giống đề. Em kiểm tra các số, dấu nhân, dấu = và kết quả."),
        chk(lines.length >= 2 && Validators.squash(lines[1]) === Validators.squash("Bạn Hoa năm nay 16 tuổi."), "Dòng 2 in đúng: Bạn Hoa năm nay 16 tuổi.", "Dòng thứ hai chưa giống đề. Em kiểm tra lại từng chữ (có dấu) và con số.")
      ]));
    },
    success: "Em đã viết đúng các lệnh in thông tin!",
    recap: `<ul><li><code>print("chữ", biểu_thức)</code> vừa in chữ vừa in kết quả tính của biểu thức.</li></ul>`
  };

  const activities = [P1, P2, P3];
  return { activities };
})();
