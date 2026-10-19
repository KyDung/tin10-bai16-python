# Bài 16. Ngôn ngữ lập trình bậc cao và Python (Tin học 10)

Web học tập tương tác theo SGK *Kết nối tri thức với cuộc sống*, Chủ đề 5, Bài 16. Công nghệ: HTML + CSS + JS thuần (script thường, không build), theo kiến trúc trong `HUONG_DAN_TAO_BAI_MOI.md`.

- **`LESSON.id` = `python-bai16`**
- **Dữ liệu Firestore:** `lessons/python-bai16/students/{lớp_họtên}` (ví dụ `10A1_NguyenVanAn`), cùng cơ sở dữ liệu `db-web-dayhoc` với các bài khác.
- **Giáo viên:** `teacher.html`, đăng nhập bằng Email/Mật khẩu (2 tài khoản đã có sẵn).

## 4 hoạt động (tuần tự, chưa đạt hoạt động trước thì khóa hoạt động sau)

| # | Hoạt động | Nội dung | Cách học sinh làm |
|---|-----------|----------|-------------------|
| 1 | **Khởi động** | Hình 16.1: ngôn ngữ máy – hợp ngữ – Python | Chọn đoạn dễ hiểu nhất + giải thích lí do |
| 2 | **Hình thành kiến thức** (5 hoạt động nhỏ) | ① Ngôn ngữ bậc cao, chương trình dịch, Python (ảnh Guido van Rossum) ② Môi trường Python, hai chế độ ③ Kiểu dữ liệu và phép toán ④ Lệnh `print()` ⑤ Thực hành `Bai1.py` | Điền chỗ trống; gõ lệnh thật trong cửa sổ Shell giả lập IDLE và viết chương trình ở chế độ soạn thảo; trả lời ngắn; thực hành đủ 5 bước (mở IDLE → New File → gõ → Save → F5) |
| 3 | **Luyện tập** (3 bài, không có lệnh mẫu) | Tính biểu thức; tìm lỗi nháy kép lồng nhau; in thông tin | Tự viết lệnh/chương trình, hệ thống báo từng tiêu chí; cuối giai đoạn bấm **NỘP PHẦN 1** |
| 4 | **Vận dụng** | Dòng đầu là chú thích, in bài thơ bằng cặp ba dấu nháy kép, in bảng nhân của một số từ 1 đến 10 | 1 chương trình, checklist đổi theo thời gian thực; nút nộp chỉ mở khi đủ yêu cầu tối thiểu |

Mã Python được **chạy thật** bằng [Pyodide](https://pyodide.org) trong Web Worker (nạp lười khi học sinh cần chạy lệnh, lần đầu cần Internet). Chương trình chạy quá 10 giây bị dừng tự động (chống vòng lặp vô hạn). Ô gõ chặn dán và ghi lại quá trình gõ (`typingStats`) để giáo viên biết học sinh tự làm.

## Việc giáo viên cần làm (một lần)

1. **Rules:** nếu Firestore đã có rules từ các bài trước thì **không cần làm gì** (đừng publish `firestore.rules` trong thư mục này, file chỉ để tham khảo và có email giữ chỗ). Dữ liệu bài này dùng đúng lược đồ chung `lessons/{id}/students/{lớp_họtên}`.
2. Firebase Authentication → bật **Email/Password** (đã bật, thử đăng nhập sai đã nhận đúng thông báo của Firebase) và, nếu đưa lên GitHub Pages, thêm tên miền `<tên>.github.io` vào **Authorized domains**.
3. Chạy thử trên máy: `python -m http.server 8000` trong thư mục này rồi mở `http://localhost:8000` (hoặc dùng Live Server). Mở `index.html` trực tiếp bằng đường dẫn file không đủ để đăng nhập Firebase.

## Chế độ thử (không ghi dữ liệu)

Mở `index.html?demo=1` để tự làm thử cả bài mà **không gửi gì lên Firebase** (thanh trên hiện “Chế độ thử”). Dùng khi giáo viên muốn kiểm tra bài, đừng dùng tên học sinh thật khi chưa bật chế độ này.

## Ánh xạ 4 hoạt động vào lược đồ chung

Lược đồ dùng chung chỉ có `learning[] / practice[] / final`, nên:

- `learning[]` = Khởi động (`activityId: "khoi-dong"`) + 5 hoạt động Hình thành kiến thức (`learn-bac-cao`, `learn-moi-truong`, `learn-gia-tri`, `learn-print`, `learn-thuc-hanh`)
- `practice[]` = `prac-bieu-thuc`, `prac-tim-loi`, `prac-in-thong-tin`
- `final` = bài Vận dụng (`code`, `characters`, `typingStats`, `requirements`, `submittedAt`)

Tiến độ được ghi nền sau mỗi hoạt động (giáo viên thấy học sinh đang học tới đâu); **NỘP PHẦN 1** và **NỘP BÀI VẬN DỤNG** đặt các cờ `progress.part1Submitted` / `progress.finalSubmitted`. Chưa nộp Phần 1 mà nộp Vận dụng thì hệ thống nộp bù Phần 1.

## Cấu trúc

```
index.html, teacher.html
css/style.css
firestore.rules                 rules dùng chung mọi bài
images/                         logo Python/C++/JavaScript, ảnh Guido van Rossum
js/
  lesson-config.js              ★ LESSON = { id, title, subtitle }
  firebase-config.js            cấu hình Firebase (dùng chung)
  storage.js                    Util + Store (localStorage, khóa gắn LESSON.id)
  runner.js                     Py: Pyodide trong Web Worker (shell / run / giới hạn thời gian)
  validators.js                 ★ validator của bài (trả { passed, errors, checks })
  editor.js                     Editor (số dòng, Tab, chặn dán, typingStats)
  shell.js                      Shell + Idle: giả lập IDLE (menu, Save As, F5, quit())
  api.js                        gửi Firestore (SDK nạp lười từ gstatic) + chế độ ?demo=1
  activity.js                   dựng 4 kiểu hoạt động: fill / steps / editor / idle
  intro.js                      ★ Hoạt động 1: Khởi động
  learning.js                   ★ Hoạt động 2: Hình thành kiến thức
  practice.js                   ★ Hoạt động 3: Luyện tập
  final.js                      ★ Hoạt động 4: Vận dụng (đề + checklist)
  app.js                        trạng thái, route theo hash, khóa/mở khóa, nộp bài
  teacher.js                    trang giáo viên (đăng nhập, xem thời gian thực, xuất CSV, xóa)
```

## Nguồn ảnh

Logo Python (Python Software Foundation) · ảnh Guido van Rossum của Daniel Stroud, giấy phép CC BY-SA 4.0, Wikimedia Commons · logo C++ (Jeremy Kratz) và JavaScript, phạm vi công cộng, Wikimedia Commons. Ảnh chụp IDLE trong sách được dựng lại bằng HTML/CSS (cửa sổ chạy được thật).
