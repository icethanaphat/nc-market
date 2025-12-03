// ใช้ key เดียวกับหน้า index เพื่อให้ดึงข้อมูลสินค้าชุดเดียวกัน
const STORAGE_KEY = "school_market_products";
const SESSION_KEY = "school_market_current_user";
const REPORT_KEY = "school_market_reports"; // ไว้ใช้ตอนเพิ่มระบบรายงาน

let allProducts = [];
let currentUser = null;
let allReports = [];

/* ---------- Toast ---------- */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.background = type === "success" ? "#10B981" : "#EF4444";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/* ---------- Permission ---------- */
function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

/* ---------- Load session / products / reports ---------- */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      currentUser = JSON.parse(raw);
    } else {
      currentUser = null;
    }
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
      if (Array.isArray(parsed)) {
        allProducts = parsed;
      }
    }
  } catch (e) {
    console.error("โหลดสินค้าไม่ได้", e);
  }
}

function loadReportsFromStorage() {
  try {
    const raw = localStorage.getItem(REPORT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        allReports = parsed;
      }
    }
  } catch (e) {
    console.error("โหลดรายงานไม่ได้", e);
  }
}

/* ---------- Header / User info ---------- */
function applyHeaderStyles() {
  const headerEl = document.getElementById("header");
  const titleEl = document.getElementById("site-title");

  if (!headerEl || !titleEl) return;

  headerEl.style.background = "#8B5CF6";
  headerEl.style.color = "#FFFFFF";
  document.body.style.fontFamily = "Kanit, 'Segoe UI', Tahoma, sans-serif";

  titleEl.textContent = "🏫 ตลาดนัดโรงเรียน";
}

function updateUserInfoUI() {
  const userDisplay = document.getElementById("user-display");
  const welcomeEl = document.getElementById("welcome-message");
  const profileName = document.getElementById("profile-name");
  const profileRole = document.getElementById("profile-role");

  if (!currentUser) return;

  const roleText = isAdmin() ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป";

  if (userDisplay) {
    userDisplay.textContent = `👤 ${currentUser.name} (${roleText})`;
  }
  if (welcomeEl) {
    welcomeEl.textContent = "แดชบอร์ดสำหรับผู้ดูแลระบบ";
  }
  if (profileName) {
    profileName.textContent = currentUser.name || "-";
  }
  if (profileRole) {
    profileRole.textContent = roleText;
  }
}

/* ---------- Render Stats ---------- */
function renderOverviewStats() {
  const totalEl = document.getElementById("stats-total-products");
  const availableEl = document.getElementById("stats-available-products");
  const soldEl = document.getElementById("stats-sold-products");

  const total = allProducts.length;
  const available = allProducts.filter((p) => p.status === "มีสินค้า").length;
  const sold = allProducts.filter((p) => p.status === "ขายแล้ว").length;

  if (totalEl) totalEl.textContent = total;
  if (availableEl) availableEl.textContent = available;
  if (soldEl) soldEl.textContent = sold;
}

function renderCategoryStats() {
  const container = document.getElementById("category-stats");
  if (!container) return;

  container.innerHTML = "";

  if (allProducts.length === 0) {
    container.innerHTML =
      '<p class="text-sm text-gray-400">ยังไม่มีข้อมูลสินค้าในระบบ</p>';
    return;
  }

  const counts = {};
  allProducts.forEach((p) => {
    const cat = p.category || "ไม่ระบุ";
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const total = allProducts.length;

  Object.entries(counts).forEach(([cat, count]) => {
    const percent = ((count / total) * 100).toFixed(1);
    const row = document.createElement("div");
    row.className = "flex items-center justify-between gap-3";

    row.innerHTML = `
      <div class="flex-1">
        <p class="text-sm font-medium">${cat}</p>
        <div class="w-full bg-gray-100 rounded-full h-2 mt-1 overflow-hidden">
          <div class="h-2 bg-indigo-500" style="width:${percent}%"></div>
        </div>
      </div>
      <div class="text-right text-xs text-gray-500 min-w-[80px]">
        <p>${count} รายการ</p>
        <p>${percent}%</p>
      </div>
    `;

    container.appendChild(row);
  });
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "-";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear() + 543; // แปลงเป็น พ.ศ.
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hh}:${mm} น.`;
}

function renderRecentProducts() {
  const tbody = document.getElementById("recent-products");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (allProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-4 text-center text-gray-400 text-sm">
          ยังไม่มีสินค้าในระบบ
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...allProducts].sort((a, b) => {
    const tA = new Date(a.created_at || 0).getTime();
    const tB = new Date(b.created_at || 0).getTime();
    return tB - tA;
  });

  const latest = sorted.slice(0, 5);

  latest.forEach((p) => {
    const tr = document.createElement("tr");
    tr.className = "border-b last:border-b-0 hover:bg-gray-50";

    const statusClass =
      p.status === "มีสินค้า"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-rose-100 text-rose-700";

    tr.innerHTML = `
      <td class="py-2 pr-2 max-w-[180px] truncate">
        ${p.product_name || "-"}
      </td>
      <td class="py-2 px-2 text-xs text-gray-600">
        ${p.category || "-"}
      </td>
      <td class="py-2 px-2 text-xs">
        ฿${parseFloat(p.price || 0).toFixed(2)}
      </td>
      <td class="py-2 px-2 text-xs">
        <span class="inline-block px-2 py-0.5 rounded-full ${statusClass}">
          ${p.status || "-"}
        </span>
      </td>
      <td class="py-2 px-2 text-xs text-gray-700 max-w-[140px] truncate">
        ${p.seller_name || "-"}
      </td>
      <td class="py-2 pl-2 text-xs text-gray-500">
        ${formatDateTime(p.created_at)}
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ---------- Render รายงาน (ตอนนี้ยังไม่มีข้อมูล, แค่รองรับโครงสร้าง) ---------- */
function renderReports() {
  const container = document.getElementById("report-list");
  if (!container) return;

  if (!allReports || allReports.length === 0) {
    container.textContent = "ยังไม่มีข้อมูลรายงาน";
    return;
  }

  container.innerHTML = "";

  allReports.forEach((r) => {
    const box = document.createElement("div");
    box.className =
      "border border-amber-200 rounded-xl p-3 mb-2 bg-amber-50 text-xs";

    box.innerHTML = `
      <p class="font-semibold text-amber-800 mb-1">
        โพสต์ที่ถูกรายงาน: ${r.product_name || "-"}
      </p>
      <p class="text-amber-900 mb-1">
        สาเหตุ: ${r.reason || "-"}
      </p>
      <p class="text-amber-900 mb-1">
        ผู้รายงาน: ${r.reporter_name || "-"}
      </p>
      <p class="text-amber-700">
        เวลา: ${formatDateTime(r.created_at)}
      </p>
    `;

    container.appendChild(box);
  });
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadSession();

  // ถ้าไม่ล็อกอิน → เด้งไปหน้า login
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // ถ้าไม่ใช่แอดมิน → เด้งกลับ index
  if (!isAdmin()) {
    showToast("เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าแดชบอร์ดนี้ได้", "error");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
    return;
  }

  applyHeaderStyles();
  updateUserInfoUI();
  loadProductsFromStorage();
  loadReportsFromStorage();

  renderOverviewStats();
  renderCategoryStats();
  renderRecentProducts();
  renderReports();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "login.html";
    });
  }
});
