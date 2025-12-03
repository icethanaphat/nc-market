// ใช้ key เดียวกับหน้า index เพื่อแชร์ข้อมูลกัน
const STORAGE_KEY = "school_market_products";
const SESSION_KEY = "school_market_current_user";

let allProducts = [];
let currentUser = null;

/* ---------- Toast แบบเดียวกับหน้า index ---------- */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.background = type === "success" ? "#10B981" : "#EF4444";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ---------- Permission เหมือนหน้า index ---------- */
function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

/* ---------- โหลด session & สินค้าจาก localStorage ---------- */
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

/* ---------- UI Header + โปรไฟล์ ---------- */
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
  const welcomeEl = document.getElementById("welcome-message");
  const profileName = document.getElementById("profile-name");
  const profileRole = document.getElementById("profile-role");

  if (!currentUser) return;

  const roleText = isAdmin() ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป";

  if (userDisplay) {
    userDisplay.textContent = `👤 ${currentUser.name} (${roleText})`;
  }
  if (welcomeEl) {
    welcomeEl.textContent = `จัดการสินค้าที่คุณโพสต์ในตลาดนัดโรงเรียน`;
  }
  if (profileName) {
    profileName.textContent = currentUser.name || "-";
  }
  if (profileRole) {
    profileRole.textContent = roleText;
  }
}

/* ---------- Render สินค้าของฉัน ---------- */
function renderMyProducts() {
  const container = document.getElementById("my-products-container");
  const emptyState = document.getElementById("my-empty-state");
  if (!container || !emptyState) return;

  container.innerHTML = "";

  if (!currentUser) {
    emptyState.classList.remove("hidden");
    return;
  }

  const myProducts = allProducts.filter(
    (p) => p.seller_name === currentUser.name
  );

  if (myProducts.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  myProducts.forEach((product) => {
    const card = document.createElement("div");
    card.className =
      "bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col";

    // รูป
    let images = [];
    try {
      if (product.images) images = JSON.parse(product.images);
    } catch (e) {
      if (product.image) images = [product.image];
    }

    const imageHtml =
      images.length > 0
        ? `<img src="${images[0]}" alt="${product.product_name}"
                 class="w-full h-40 object-cover"
                 onerror="this.style.display='none';">`
        : `<div class="w-full h-40 flex items-center justify-center bg-gray-200 text-4xl">📦</div>`;

    // ปุ่มลบ แสดงเฉพาะแอดมิน
    const deleteButtonHtml = isAdmin()
      ? `<button
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white"
            data-action="delete"
            data-id="${product.__backendId}">
            ลบ
         </button>`
      : "";

    card.innerHTML = `
      ${imageHtml}
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="text-lg font-bold mb-1 line-clamp-1">${product.product_name}</h3>
        <p class="text-sm text-gray-600 mb-2 line-clamp-2">${product.description}</p>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xl font-extrabold text-indigo-600">
            ฿${parseFloat(product.price).toFixed(2)}
          </span>
          <span class="text-xs px-2 py-1 rounded-full ${
            product.status === "มีสินค้า"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }">
            ${product.status}
          </span>
        </div>
        <p class="text-xs text-gray-500 mb-1">📦 เหลือ ${product.quantity} ชิ้น</p>
        <p class="text-xs text-gray-500 mb-3 break-words">
          📞 ติดต่อ: <span class="font-semibold">${product.contact}</span>
        </p>

        <div class="mt-auto flex gap-2 pt-2 border-t border-gray-100">
          <button
            class="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-white"
            data-action="toggle"
            data-id="${product.__backendId}">
            ${product.status === "มีสินค้า" ? "ทำเป็นขายแล้ว" : "เปลี่ยนเป็นมีสินค้า"}
          </button>
          ${deleteButtonHtml}
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // ผูก event ให้ปุ่มในแต่ละการ์ด
  container.querySelectorAll("button[data-action]").forEach((btn) => {
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (action === "delete") {
      btn.addEventListener("click", () => handleDeleteMyProduct(id));
    } else if (action === "toggle") {
      btn.addEventListener("click", () => handleToggleStatusMyProduct(id));
    }
  });
}

/* ---------- ลบสินค้า (เฉพาะแอดมิน) ---------- */
function handleDeleteMyProduct(id) {
  if (!isAdmin()) {
    showToast("คุณไม่มีสิทธิ์ลบสินค้านี้ (เฉพาะผู้ดูแลระบบ)", "error");
    return;
  }

  const product = allProducts.find((p) => p.__backendId === id);
  if (!product) return;

  const ok = confirm(`คุณต้องการลบสินค้า "${product.product_name}" ใช่หรือไม่?`);
  if (!ok) return;

  allProducts = allProducts.filter((p) => p.__backendId !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProducts));
  } catch (e) {
    console.error("บันทึกสินค้าไม่ได้", e);
  }
  showToast("ลบสินค้าสำเร็จ!", "success");
  renderMyProducts();
}

/* ---------- เปลี่ยนสถานะสินค้า ---------- */
function handleToggleStatusMyProduct(id) {
  const idx = allProducts.findIndex((p) => p.__backendId === id);
  if (idx === -1) return;

  const current = allProducts[idx];
  const newStatus = current.status === "มีสินค้า" ? "ขายแล้ว" : "มีสินค้า";
  allProducts[idx].status = newStatus;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProducts));
  } catch (e) {
    console.error("บันทึกสินค้าไม่ได้", e);
  }
  showToast(`เปลี่ยนสถานะเป็น "${newStatus}" แล้ว`, "success");
  renderMyProducts();
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loadSession();
  if (!currentUser) {
    // ถ้าไม่มี session ให้กลับไปหน้า login
    window.location.href = "login.html";
    return;
  }

  applyHeaderStyles();
  updateUserInfoUI();
  loadProductsFromStorage();
  renderMyProducts();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "login.html";
    });
  }
});
