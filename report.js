// ใช้ key เดียวกับระบบหลัก
const STORAGE_KEY = "school_market_products";
const SESSION_KEY = "school_market_current_user";

let allProducts = [];
let currentUser = null;

/* ---------- Toast ---------- */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.background = type === "success" ? "#10B981" : "#EF4444";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ---------- Permission ---------- */
function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

/* ---------- Session & Storage ---------- */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) currentUser = JSON.parse(raw);
    else currentUser = null;
  } catch (e) {
    console.error("โหลด session ไม่ได้", e);
    currentUser = null;
  }
}

function loadProductsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) allProducts = parsed;
    }
  } catch (e) {
    console.error("โหลดสินค้าไม่ได้", e);
  }
}

/* ---------- Header UI ---------- */
function applyHeaderStyles() {
  const headerEl = document.getElementById("header");
  const titleEl = document.getElementById("site-title");
  const welcomeEl = document.getElementById("welcome-message");

  if (!headerEl || !titleEl || !welcomeEl) return;

  headerEl.style.background = "#8B5CF6";
  headerEl.style.color = "#FFFFFF";

  document.body.style.fontFamily = "Kanit, 'Segoe UI', Tahoma, sans-serif";
  titleEl.textContent = "🏫 ตลาดนัดโรงเรียน";
}

function updateUserInfoUI() {
  const userDisplay = document.getElementById("user-display");
  if (!userDisplay) return;
  if (!currentUser) return;

  const roleText = isAdmin() ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป";
  userDisplay.textContent = `👤 ${currentUser.name} (${roleText})`;
}

/* ---------- Helper: แปลงวันที่ ---------- */
function formatDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "-";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear() + 543; // แปลงเป็น พ.ศ.
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm} น.`;
}

function parseDateOnlyToTimestamp(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

/* ---------- สร้างรายการตาม filter ---------- */
function getFilteredProducts() {
  const fromEl = document.getElementById("filter-date-from");
  const toEl = document.getElementById("filter-date-to");
  const statusEl = document.getElementById("filter-status");
  const categoryEl = document.getElementById("filter-category");

  const fromTs = parseDateOnlyToTimestamp(fromEl?.value);
  const toTs = parseDateOnlyToTimestamp(toEl?.value);
  const statusVal = statusEl?.value || "";
  const categoryVal = categoryEl?.value || "";

  return allProducts.filter((p) => {
    // filter date จาก created_at
    if (fromTs || toTs) {
      const created = new Date(p.created_at || "").getTime();
      if (!Number.isFinite(created)) {
        // ถ้ามีการเลือกวันที่ แต่สินค้านี้ไม่มี created_at → ตัดออก
        return false;
      }
      if (fromTs && created < fromTs) return false;
      // toTs ให้นับถึงสิ้นวัน
      if (toTs && created > toTs + 24 * 60 * 60 * 1000 - 1) return false;
    }

    if (statusVal && p.status !== statusVal) return false;
    if (categoryVal && p.category !== categoryVal) return false;

    return true;
  });
}

/* ---------- Render สรุปตัวเลข ---------- */
function renderSummary(filtered) {
  const totalEl = document.getElementById("rep-total");
  const availableEl = document.getElementById("rep-available");
  const soldEl = document.getElementById("rep-sold");
  const sellersEl = document.getElementById("rep-sellers");

  const total = filtered.length;
  const available = filtered.filter((p) => p.status === "มีสินค้า").length;
  const sold = filtered.filter((p) => p.status === "ขายแล้ว").length;

  const sellerSet = new Set();
  filtered.forEach((p) => {
    if (p.seller_name) sellerSet.add(p.seller_name);
  });
  const sellers = sellerSet.size;

  if (totalEl) totalEl.textContent = total;
  if (availableEl) availableEl.textContent = available;
  if (soldEl) soldEl.textContent = sold;
  if (sellersEl) sellersEl.textContent = sellers;
}

/* ---------- Render สรุปตามหมวดหมู่ ---------- */
function renderCategorySummary(filtered) {
  const tbody = document.getElementById("rep-category-tbody");
  if (!tbody) return;

  const counts = {};
  filtered.forEach((p) => {
    const cat = p.category || "ไม่ระบุ";
    counts[cat] = (counts[cat] || 0) + 1;
  });

  tbody.innerHTML = "";

  const cats = Object.keys(counts);
  if (cats.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="px-3 py-2 text-center text-gray-500" colspan="2">
      ไม่มีข้อมูลตามเงื่อนไข
    </td>`;
    tbody.appendChild(tr);
    return;
  }

  cats.forEach((cat) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-2 text-sm">${cat}</td>
      <td class="px-3 py-2 text-center font-semibold">${counts[cat]}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------- Render ตารางสินค้า ---------- */
function renderProductsTable(filtered) {
  const tbody = document.getElementById("rep-products-tbody");
  const countText = document.getElementById("rep-count-text");
  if (!tbody || !countText) return;

  countText.textContent = `${filtered.length} รายการ`;

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-3 text-center text-gray-500" colspan="7">
        ไม่มีข้อมูลตรงตามเงื่อนไข
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  // เรียงใหม่→เก่า
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return db - da;
  });

  sorted.forEach((p) => {
    const price = parseFloat(p.price || 0);
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50";
    tr.innerHTML = `
      <td class="px-3 py-2 align-top">${p.product_name || "-"}</td>
      <td class="px-3 py-2 align-top">${p.category || "-"}</td>
      <td class="px-3 py-2 align-top text-right">฿${price.toFixed(2)}</td>
      <td class="px-3 py-2 align-top text-center">${p.status || "-"}</td>
      <td class="px-3 py-2 align-top">${p.seller_name || "-"}</td>
      <td class="px-3 py-2 align-top break-words">${p.contact || "-"}</td>
      <td class="px-3 py-2 align-top text-center text-xs text-gray-600">
        ${formatDate(p.created_at)}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------- Generate Report ---------- */
function generateReport() {
  const filtered = getFilteredProducts();
  renderSummary(filtered);
  renderCategorySummary(filtered);
  renderProductsTable(filtered);
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadSession();

  // จำกัดสิทธิ์: เฉพาะแอดมิน
  if (!currentUser || !isAdmin()) {
    showToast("เฉพาะแอดมินเท่านั้นที่เข้าหน้ารายงานได้", "error");
    window.location.href = "index.html";
    return;
  }

  applyHeaderStyles();
  updateUserInfoUI();
  loadProductsFromStorage();

  // เรียกครั้งแรก (ยังไม่เลือกวันที่ = รายงานจากทุกสินค้าทั้งระบบ)
  generateReport();

  // ปุ่มดูรายงาน
  const btnGen = document.getElementById("btn-generate-report");
  if (btnGen) {
    btnGen.addEventListener("click", generateReport);
  }

  // ปุ่มพิมพ์ออกกระดาษ
  const btnPrint = document.getElementById("btn-print-report");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  // logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "login.html";
    });
  }
});
