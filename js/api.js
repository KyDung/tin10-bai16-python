// Gửi dữ liệu lên Firestore. SDK nạp LƯỜI từ gstatic (import()) để trang mở nhanh.
// Mô hình dữ liệu dùng chung mọi bài: lessons/{LESSON.id}/students/{lớp_họtên}
//   { lessonId, student{name,className}, learning[], practice[], progress{...}, final{...}, updatedAt }
// Bài này có 4 hoạt động, ánh xạ vào lược đồ chung:
//   learning[] = Khởi động (activityId "khoi-dong") + 5 hoạt động Hình thành kiến thức
//   practice[] = Luyện tập;   final = Vận dụng
const Api = (() => {
  const SDK_VERSION = "10.12.2";
  const TIMEOUT_MS = 20000;
  let sdkPromise = null;

  // Chế độ thử (index.html?demo=1): chạy đủ luồng nhưng KHÔNG gửi gì lên Firebase – để giáo viên tự thử bài.
  const DEMO = /[?&]demo=1\b/.test(location.search);

  const configured = () => !DEMO && !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && !/DIEN_|YOUR_/i.test(FIREBASE_CONFIG.apiKey));

  function load() {
    if (!configured()) return Promise.reject(new Error("Chưa điền cấu hình Firebase."));
    if (!sdkPromise) {
      const base = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/`;
      sdkPromise = Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js")]).then(([app, fs]) => {
        const a = app.getApps().length ? app.getApp() : app.initializeApp(FIREBASE_CONFIG);
        return { fs, db: fs.getFirestore(a) };
      });
      sdkPromise.catch(() => { sdkPromise = null; });   // lần sau cho phép thử lại
    }
    return sdkPromise;
  }

  // Khóa học sinh: {lớp}_{họtên} chỉ gồm chữ+số, khớp regex trong firestore.rules.
  function studentKey(student) {
    const cls = Util.slug(student.className, 15);
    const name = Util.slug(student.name, 40);
    if (!cls || !name) throw new Error("Thiếu họ tên hoặc lớp.");
    return `${cls}_${name}`;
  }

  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("Hết thời gian chờ mạng.")), ms))]);
  const clean = (o) => JSON.parse(JSON.stringify(o));   // Firestore không nhận undefined

  // type: 'progress' (ghi nền sau mỗi hoạt động) | 'part1' (nộp phần 1) | 'final' (nộp Vận dụng)
  async function send(type, data) {
    if (DEMO) { await Util.sleep(300); return { ok: true, demo: true }; }
    const { fs, db } = await load();
    const key = studentKey(data.student);
    const payload = {
      lessonId: LESSON.id,
      student: { name: data.student.name, className: data.student.className }
    };
    if (type === "progress" || type === "part1") {
      payload.learning = data.learning;
      payload.practice = data.practice;
      payload.progress = {
        learningCompleted: data.learning.filter((r) => r.passed).length,
        practiceCompleted: data.practice.filter((r) => r.passed).length
      };
      if (type === "part1") {
        payload.progress.part1Submitted = true;
        payload.progress.part1SubmittedAt = data.part1SubmittedAt;
      }
    } else if (type === "final") {
      payload.final = data.final;
      payload.progress = { finalSubmitted: true, finalSubmittedAt: data.final.submittedAt };
    }
    const batch = fs.writeBatch(db);
    batch.set(fs.doc(db, "lessons", LESSON.id), { title: LESSON.title, updatedAt: fs.serverTimestamp() }, { merge: true });
    const docData = clean(payload);
    docData.updatedAt = fs.serverTimestamp();   // gắn sau khi làm sạch để không phá giá trị đặc biệt của Firestore
    batch.set(fs.doc(db, "lessons", LESSON.id, "students", key), docData, { merge: true });
    await withTimeout(batch.commit(), TIMEOUT_MS);
    return { ok: true, path: `lessons/${LESSON.id}/students/${key}` };
  }

  return { DEMO, configured, send, studentKey, warmUp() { if (!DEMO) load().catch(() => {}); } };
})();
