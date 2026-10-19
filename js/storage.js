// Tiện ích chung (Util) và lưu trữ cục bộ (Store). Khóa localStorage gắn LESSON.id để các bài không đè nhau.
const Util = {
  esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  },
  sleep(ms) { return new Promise((r) => setTimeout(r, ms)); },
  nowISO() { return new Date().toISOString(); },
  // Bỏ dấu tiếng Việt, hạ chữ thường, gộp khoảng trắng -> so sánh đáp án gõ tự do.
  norm(s) {
    return String(s ?? "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "d")
      .toLowerCase().replace(/\s+/g, " ").trim();
  },
  // Chuẩn hóa dòng lệnh Python để so khớp "gõ lại": bỏ khoảng trắng, đưa nháy đơn về nháy kép, bỏ dấu.
  normCode(s) {
    return Util.norm(s).replace(/\s+/g, "").replace(/'/g, '"').replace(/×/g, "*");
  },
  // Tô màu cú pháp Python đơn giản cho khối mã chỉ-đọc (theo màu của IDLE).
  highlight(code) {
    const KW = /^(and|as|assert|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|not|or|pass|raise|return|True|try|while|with|yield)$/;
    const BI = /^(print|input|int|float|str|range|len|type|quit|exit|abs|round|max|min|sum)$/;
    const re = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|#[^\n]*|\b\d+(?:\.\d+)?\b|[A-Za-z_À-ỹ][\wÀ-ỹ]*)/g;
    let out = "", last = 0, m;
    while ((m = re.exec(code))) {
      out += Util.esc(code.slice(last, m.index));
      const t = m[0];
      let cls = "";
      if (t[0] === '"' || t[0] === "'") cls = "tk-str";
      else if (t[0] === "#") cls = "tk-cmt";
      else if (/^\d/.test(t)) cls = "tk-num";
      else if (KW.test(t)) cls = "tk-kw";
      else if (BI.test(t)) cls = "tk-bi";
      out += cls ? `<span class="${cls}">${Util.esc(t)}</span>` : Util.esc(t);
      last = m.index + t.length;
    }
    return out + Util.esc(code.slice(last));
  },
  // Bỏ dấu để tạo khóa Firestore: chỉ chữ + số.
  slug(s, max) {
    const t = String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    return t.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("").slice(0, max);
  }
};

const Store = {
  prefix: `py-learning-${LESSON.id}::`,
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(Store.prefix + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(Store.prefix + key, JSON.stringify(value)); return true; } catch (e) { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(Store.prefix + key); } catch (e) { /* bỏ qua */ }
  },
  clearAll() {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(Store.prefix)).forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* bỏ qua */ }
  }
};
