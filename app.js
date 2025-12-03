/* =========================================================
 * 1) CONFIG & CONSTANTS
 * =======================================================*/
const defaultConfig = {
  site_title: "🏫 ตลาดนัดโรงเรียน",
  welcome_message:
    "ยินดีต้อนรับสู่ตลาดออนไลน์ของเรา - ซื้อขายสินค้าระหว่างนักเรียนได้อย่างสะดวก",
  add_button_text: "+ เพิ่มสินค้าใหม่",
  header_color: "#8B5CF6",
  card_color: "#FFFFFF",
  text_color: "#1F2937",
  primary_button_color: "#8B5CF6",
  secondary_button_color: "#6B7280",
  font_family: "Kanit",
  font_size: 16,
};

const STORAGE_KEY = "school_market_products";
const SESSION_KEY = "school_market_current_user";
const REPORTS_KEY = "school_market_reports";

/* =========================================================
 * 2) GLOBAL STATE
 * =======================================================*/
let allProducts = [];
let allReports = [];
let editingProduct = null;
let currentImageData = [];
let currentUser = null;
let productBeingViewedForReport = null;

/* =========================================================
 * 3) UTILITIES
 * =======================================================*/
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.background = type === "success" ? "#10B981" : "#EF4444";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getCategoryIcon(category) {
  const icons = {
    เครื่องเขียน: "📝",
    งานฝีมือ: "🎨",
    หนังสือ: "📚",
    อุปกรณ์กีฬา: "⚽",
    อื่นๆ: "📦",
  };
  return icons[category] || "📦";
}

/* ====== ฟังก์ชันสิทธิ์การเข้าถึง ====== */
function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

function isOwner(product) {
  return currentUser && product.seller_name === currentUser.name;
}

function canEditProduct(product) {
  // เจ้าของโพสต์ + แอดมิน แก้ไขได้
  return isAdmin() || isOwner(product);
}

function canDeleteProduct(product) {
  // ลบได้เฉพาะแอดมิน
  return isAdmin();
}

function canToggleStatus(product) {
  // เจ้าของโพสต์ + แอดมิน เปลี่ยนสถานะได้
  return isAdmin() || isOwner(product);
}

/* =========================================================
 * 4) STORAGE
 * =======================================================*/
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

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProducts));
  } catch (e) {
    console.error("บันทึกสินค้าไม่ได้", e);
  }
}

function loadReportsFromStorage() {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
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

function saveReports() {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(allReports));
  } catch (e) {
    console.error("บันทึกรายงานไม่ได้", e);
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      currentUser = JSON.parse(raw);
    }
  } catch (e) {
    console.error("โหลด session ไม่ได้", e);
    currentUser = null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error("ลบ session ไม่ได้", e);
  }
  currentUser = null;
}

/* =========================================================
 * 5) UI CONFIG
 * =======================================================*/
function applyDefaultStyles() {
  const titleEl = document.getElementById("site-title");
  const welcomeEl = document.getElementById("welcome-message");
  const addBtnTextEl = document.getElementById("add-button-text");
  const headerEl = document.getElementById("header");
  const addProductBtn = document.getElementById("add-product-btn");
  const submitBtn = document.getElementById("submit-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  if (
    !titleEl ||
    !welcomeEl ||
    !addBtnTextEl ||
    !headerEl ||
    !addProductBtn ||
    !submitBtn ||
    !cancelBtn
  )
    return;

  const customFont = defaultConfig.font_family;
  const baseFont = "Segoe UI, Tahoma, sans-serif";
  const headerColor = defaultConfig.header_color;
  const primaryBtnColor = defaultConfig.primary_button_color;
  const secondaryBtnColor = defaultConfig.secondary_button_color;
  const baseSize = defaultConfig.font_size;

  document.body.style.fontFamily = `${customFont}, ${baseFont}`;
  titleEl.style.fontSize = `${baseSize * 2}px`;
  welcomeEl.style.fontSize = `${baseSize}px`;
  addBtnTextEl.style.fontSize = `${baseSize}px`;

  headerEl.style.background = headerColor;
  headerEl.style.color = "#FFFFFF";

  addProductBtn.style.background = primaryBtnColor;
  addProductBtn.style.color = "#FFFFFF";
  submitBtn.style.background = primaryBtnColor;
  submitBtn.style.color = "#FFFFFF";
  cancelBtn.style.background = secondaryBtnColor;
  cancelBtn.style.color = "#FFFFFF";

  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const statusFilter = document.getElementById("status-filter");
  if (searchInput) searchInput.style.borderColor = primaryBtnColor;
  if (categoryFilter) categoryFilter.style.borderColor = primaryBtnColor;
  if (statusFilter) statusFilter.style.borderColor = primaryBtnColor;

  titleEl.textContent = defaultConfig.site_title;
  welcomeEl.textContent = defaultConfig.welcome_message;
  addBtnTextEl.textContent = defaultConfig.add_button_text;
}

function updateHeaderUserDisplay() {
  const userDisplay = document.getElementById("user-display");
  const welcomeEl = document.getElementById("welcome-message");
  if (!userDisplay || !welcomeEl) return;

  if (currentUser) {
    const roleText = isAdmin() ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป";
    userDisplay.textContent = `👤 ${currentUser.name} (${roleText})`;
    welcomeEl.textContent = `ยินดีต้อนรับคุณ ${currentUser.name} สู่ตลาดนัดโรงเรียน`;
  } else {
    userDisplay.textContent = "";
    welcomeEl.textContent = defaultConfig.welcome_message;
  }
}

/* =========================================================
 * 6) IMAGE HANDLING
 * =======================================================*/
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas error"));

        ctx.drawImage(img, 0, 0, width, height);
        let compressedData = canvas.toDataURL("image/jpeg", quality);
        const sizeInKB = (compressedData.length * 3) / 4 / 1024;

        if (sizeInKB > 500 && quality > 0.3) {
          const newQuality = Math.max(0.3, quality - 0.1);
          compressImage(file, maxWidth, newQuality).then(resolve).catch(reject);
        } else {
          resolve(compressedData);
        }
      };
      img.onerror = () => reject(new Error("image load error"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("file read error"));
    reader.readAsDataURL(file);
  });
}

async function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  if (!files || files.length === 0) return;

  if (currentImageData.length + files.length > 5) {
    showToast("สามารถอัปโหลดได้สูงสุด 5 รูปเท่านั้น", "error");
    event.target.value = "";
    return;
  }

  showToast("กำลังบีบอัดรูปภาพ...", "success");

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`${file.name} ใหญ่เกิน 10MB - ข้ามไฟล์นี้`, "error");
      continue;
    }
    if (!file.type.startsWith("image/")) {
      showToast(`${file.name} ไม่ใช่ไฟล์รูปภาพ - ข้ามไฟล์นี้`, "error");
      continue;
    }
    try {
      const compressedData = await compressImage(file);
      currentImageData.push(compressedData);
    } catch (err) {
      console.error(err);
      showToast(`ไม่สามารถบีบอัด ${file.name} ได้`, "error");
    }
  }

  renderImagePreview();
  event.target.value = "";
}

function renderImagePreview() {
  const imagePreview = document.getElementById("image-preview");
  const previewGrid = document.getElementById("preview-grid");
  if (!imagePreview || !previewGrid) return;

  if (currentImageData.length === 0) {
    imagePreview.classList.add("hidden");
    return;
  }

  imagePreview.classList.remove("hidden");
  previewGrid.innerHTML = "";

  currentImageData.forEach((imgData, index) => {
    const div = document.createElement("div");
    div.className = "relative";
    div.innerHTML = `
      <img src="${imgData}" class="w-full h-32 object-cover rounded-lg">
      <button type="button"
              class="absolute top-1 right-1 w-8 h-8 rounded-full font-bold text-white shadow-lg"
              style="background:#EF4444;">×</button>`;
    div.querySelector("button").onclick = () => {
      currentImageData.splice(index, 1);
      renderImagePreview();
      showToast("ลบรูปภาพแล้ว", "success");
    };
    previewGrid.appendChild(div);
  });
}

function removeAllImages() {
  currentImageData = [];
  const productImage = document.getElementById("product-image");
  const imagePreview = document.getElementById("image-preview");
  if (productImage) productImage.value = "";
  if (imagePreview) imagePreview.classList.add("hidden");
}

/* =========================================================
 * 7) RENDER PRODUCTS
 * =======================================================*/
function renderProducts() {
  const container = document.getElementById("products-container");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const statusFilter = document.getElementById("status-filter");

  if (!container || !emptyState || !searchInput || !categoryFilter || !statusFilter)
    return;

  const searchTerm = searchInput.value.toLowerCase();
  const categoryFilterValue = categoryFilter.value;
  const statusFilterValue = statusFilter.value;

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.seller_name.toLowerCase().includes(searchTerm);

    const matchesCategory =
      !categoryFilterValue || product.category === categoryFilterValue;

    const matchesStatus =
      !statusFilterValue || product.status === statusFilterValue;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (filteredProducts.length === 0) {
    container.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  const existingCards = new Map(
    [...container.children].map((el) => [el.dataset.productId, el])
  );

  filteredProducts.forEach((product) => {
    const cardId = product.__backendId;
    if (existingCards.has(cardId)) {
      updateProductCard(existingCards.get(cardId), product);
      existingCards.delete(cardId);
    } else {
      container.appendChild(createProductCard(product));
    }
  });

  existingCards.forEach((el) => el.remove());
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card bg-white rounded-xl shadow-md overflow-hidden";
  card.dataset.productId = product.__backendId;
  updateProductCard(card, product);
  return card;
}

/* ✅ เวอร์ชันสุดท้ายของ updateProductCard (เหลือตัวเดียวในไฟล์) */
function updateProductCard(card, product) {
  const config = defaultConfig;
  const cardColor = config.card_color;
  const textColor = config.text_color;
  const primaryColor = config.primary_button_color;

  card.style.background = cardColor;
  card.style.color = textColor;

  const statusColor = product.status === "มีสินค้า" ? "#10B981" : "#EF4444";
  const statusBg = product.status === "มีสินค้า" ? "#D1FAE5" : "#FEE2E2";

  let images = [];
  try {
    if (product.images) images = JSON.parse(product.images);
  } catch (e) {
    if (product.image) images = [product.image];
  }

  const imageHtml =
    images.length > 0
      ? `<img src="${images[0]}" alt="${product.product_name}" class="product-image"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="no-image-placeholder" style="display:none;">
           ${getCategoryIcon(product.category)}
         </div>`
      : `<div class="no-image-placeholder">${getCategoryIcon(
          product.category
        )}</div>`;

  // ✅ เช็คสิทธิ์ทีละปุ่ม
  const canEdit   = canEditProduct(product);   // เจ้าของ + แอดมิน
  const canDelete = canDeleteProduct(product); // แอดมินเท่านั้น
  const canToggle = canToggleStatus(product);  // เจ้าของ + แอดมิน

  let adminButtonsHtml = "";
  if (canEdit || canDelete || canToggle) {
    adminButtonsHtml += `<div class="flex gap-2 mt-2">`;

    if (canEdit) {
      adminButtonsHtml += `
        <button class="edit-btn flex-1 px-4 py-2 rounded-lg font-semibold transition-all"
                style="background:${primaryColor};color:white;">
          ✏️ แก้ไข
        </button>`;
    }

    if (canDelete) {
      adminButtonsHtml += `
        <button class="delete-btn px-4 py-2 rounded-lg font-semibold transition-all"
                style="background:#EF4444;color:white;">
          🗑️ ลบ
        </button>`;
    }

    if (canToggle) {
      adminButtonsHtml += `
        <button class="toggle-status-btn px-4 py-2 rounded-lg font-semibold transition-all"
                style="background:#6B7280;color:white;">
          ${product.status === "มีสินค้า" ? "✅" : "↩️"}
        </button>`;
    }

    adminButtonsHtml += `</div>`;
  }

  card.innerHTML = `
    ${imageHtml}
    <div class="p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="category-badge" style="background:#F3E8FF;color:#7C3AED;">
            ${product.category}
          </span>
        </div>
        <span class="status-badge" style="background:${statusBg};color:${statusColor};">
          ${product.status}
        </span>
      </div>
      <h3 class="text-xl font-bold mb-2">${product.product_name}</h3>
      <p class="opacity-75 mb-4 text-sm line-clamp-2">${product.description}</p>
      <div class="flex items-center justify-between mb-4">
        <div class="text-3xl font-bold" style="color:${primaryColor};">
          ฿${parseFloat(product.price).toFixed(2)}
        </div>
        <div class="text-sm opacity-75">📦 เหลือ ${product.quantity} ชิ้น</div>
      </div>

      <!-- ไม่โชว์ข้อมูลผู้ขาย/ติดต่อบนการ์ด -->
      <button class="view-detail-btn w-full mb-2 px-4 py-2 rounded-lg font-semibold transition-all"
              style="background:#4B5563;color:white;">
        💬 สนใจสินค้า
      </button>

      ${adminButtonsHtml}
    </div>`;

  const editBtn   = card.querySelector(".edit-btn");
  const deleteBtn = card.querySelector(".delete-btn");
  const toggleBtn = card.querySelector(".toggle-status-btn");
  const viewBtn   = card.querySelector(".view-detail-btn");

  if (editBtn)   editBtn.onclick   = () => openEditModal(product);
  if (deleteBtn) deleteBtn.onclick = () => confirmDelete(product);
  if (toggleBtn) toggleBtn.onclick = () => toggleStatus(product);

  // ถ้ายังไม่ล็อกอิน ให้เด้งไปหน้า login ก่อนดูรายละเอียด
  if (viewBtn) {
    viewBtn.onclick = () => {
      if (!currentUser) {
        window.location.href = "login.html";
      } else {
        openDetailModal(product);
      }
    };
  }
}

/* =========================================================
 * 8) MODAL & FORM (ADD / EDIT)
 * =======================================================*/
function openAddModal() {
  if (!currentUser) {
    showToast("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า", "error");
    window.location.href = "login.html";
    return;
  }

  editingProduct = null;
  currentImageData = [];
  document.getElementById("modal-title").textContent = "เพิ่มสินค้าใหม่";
  document.getElementById("submit-text").textContent = "บันทึกสินค้า";
  document.getElementById("product-form").reset();
  document.getElementById("image-preview").classList.add("hidden");

  const sellerNameInput = document.getElementById("seller-name");
  if (sellerNameInput) {
    sellerNameInput.value = currentUser.name || "";
    sellerNameInput.readOnly = !isAdmin();
  }

  document.getElementById("product-modal").style.display = "flex";
}

function openEditModal(product) {
  if (!currentUser) {
    showToast("กรุณาเข้าสู่ระบบใหม่", "error");
    window.location.href = "login.html";
    return;
  }
  if (!canEditProduct(product)) {
    showToast("คุณไม่มีสิทธิ์แก้ไขสินค้านี้", "error");
    return;
  }

  editingProduct = product;

  try {
    if (product.images) currentImageData = JSON.parse(product.images);
    else if (product.image) currentImageData = [product.image];
    else currentImageData = [];
  } catch (e) {
    currentImageData = [];
  }

  document.getElementById("modal-title").textContent = "แก้ไขสินค้า";
  document.getElementById("submit-text").textContent = "บันทึกการแก้ไข";

  document.getElementById("product-name").value = product.product_name;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-quantity").value = product.quantity;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-description").value = product.description;

  const sellerNameInput = document.getElementById("seller-name");
  if (sellerNameInput) {
    sellerNameInput.value = product.seller_name;
    sellerNameInput.readOnly = !isAdmin();
  }

  document.getElementById("seller-contact").value = product.contact;

  renderImagePreview();
  document.getElementById("product-modal").style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.style.display = "none";
  editingProduct = null;
  removeAllImages();
}

async function handleSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submit-btn");
  const submitText = document.getElementById("submit-text");
  const originalText = submitText.textContent;

  submitBtn.disabled = true;
  submitText.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const productName = document.getElementById("product-name").value.trim();
    const productPrice = document.getElementById("product-price").value;
    const productQuantity = document.getElementById("product-quantity").value;
    const productCategory = document.getElementById("product-category").value;
    const productDescription = document
      .getElementById("product-description")
      .value.trim();
    const sellerName = document.getElementById("seller-name").value.trim();
    const sellerContact = document
      .getElementById("seller-contact")
      .value.trim();

    if (
      !productName ||
      !productPrice ||
      !productQuantity ||
      !productCategory ||
      !productDescription ||
      !sellerName ||
      !sellerContact
    ) {
      showToast("กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      submitBtn.disabled = false;
      submitText.textContent = originalText;
      return;
    }

    const price = parseFloat(productPrice);
    const quantity = parseInt(productQuantity);

    if (isNaN(price) || price < 0) {
      showToast("กรุณากรอกราคาที่ถูกต้อง", "error");
      submitBtn.disabled = false;
      submitText.textContent = originalText;
      return;
    }

    if (isNaN(quantity) || quantity < 1) {
      showToast("กรุณากรอกจำนวนที่ถูกต้อง", "error");
      submitBtn.disabled = false;
      submitText.textContent = originalText;
      return;
    }

    const productData = {
      __backendId: editingProduct
        ? editingProduct.__backendId
        : Date.now().toString(),
      product_name: productName,
      price,
      quantity,
      category: productCategory,
      description: productDescription,
      seller_name: sellerName,
      contact: sellerContact,
      images: JSON.stringify(currentImageData),
      status: editingProduct ? editingProduct.status : "มีสินค้า",
      created_at: editingProduct
        ? editingProduct.created_at
        : new Date().toISOString(),
    };

    if (editingProduct) {
      const idx = allProducts.findIndex(
        (p) => p.__backendId === editingProduct.__backendId
      );
      if (idx !== -1) allProducts[idx] = productData;
    } else {
      allProducts.push(productData);
    }

    saveProducts();
    renderProducts();
    showToast(
      editingProduct ? "แก้ไขสินค้าสำเร็จ!" : "เพิ่มสินค้าสำเร็จ!",
      "success"
    );
    closeModal();
  } catch (err) {
    console.error(err);
    showToast("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
  }

  submitBtn.disabled = false;
  submitText.textContent = originalText;
}

/* =========================================================
 * 9) PRODUCT ACTIONS (DELETE / TOGGLE)
 * =======================================================*/
function confirmDelete(product) {
  if (!currentUser) {
    showToast("กรุณาเข้าสู่ระบบใหม่", "error");
    window.location.href = "login.html";
    return;
  }
  if (!canDeleteProduct(product)) {
    showToast("คุณไม่มีสิทธิ์ลบสินค้านี้", "error");
    return;
  }

  const card = document.querySelector(
    `[data-product-id="${product.__backendId}"]`
  );
  if (!card) return;

  const deleteBtn = card.querySelector(".delete-btn");
  if (!deleteBtn) return;

  const originalContent = deleteBtn.innerHTML;
  deleteBtn.innerHTML = "❓ ยืนยันลบ?";
  deleteBtn.style.background = "#DC2626";

  const timeoutId = setTimeout(() => {
    deleteBtn.innerHTML = originalContent;
    deleteBtn.style.background = "#EF4444";
    deleteBtn.onclick = () => confirmDelete(product);
  }, 3000);

  deleteBtn.onclick = () => {
    clearTimeout(timeoutId);
    allProducts = allProducts.filter(
      (p) => p.__backendId !== product.__backendId
    );
    saveProducts();
    renderProducts();
    showToast("ลบสินค้าสำเร็จ!", "success");
  };
}

function toggleStatus(product) {
  if (!currentUser) {
    showToast("กรุณาเข้าสู่ระบบใหม่", "error");
    window.location.href = "login.html";
    return;
  }
  if (!canToggleStatus(product)) {
    showToast("คุณไม่มีสิทธิ์เปลี่ยนสถานะสินค้านี้", "error");
    return;
  }

  const idx = allProducts.findIndex(
    (p) => p.__backendId === product.__backendId
  );
  if (idx === -1) return;

  const newStatus =
    allProducts[idx].status === "มีสินค้า" ? "ขายแล้ว" : "มีสินค้า";
  allProducts[idx].status = newStatus;
  saveProducts();
  renderProducts();
  showToast(`เปลี่ยนสถานะเป็น "${newStatus}" แล้ว!`, "success");
}

/* =========================================================
 * 10) DETAIL MODAL + REPORT MODAL
 * =======================================================*/
function openDetailModal(product) {
  const modal = document.getElementById("product-detail-modal");
  if (!modal) return;

  productBeingViewedForReport = product;

  const titleEl    = document.getElementById("detail-title");
  const descEl     = document.getElementById("detail-description");
  const priceEl    = document.getElementById("detail-price");
  const statusEl   = document.getElementById("detail-status");
  const categoryEl = document.getElementById("detail-category");
  const sellerEl   = document.getElementById("detail-seller");
  const contactEl  = document.getElementById("detail-contact");
  const imagesBox  = document.getElementById("detail-images");

  let images = [];
  try {
    if (product.images) images = JSON.parse(product.images);
  } catch (e) {
    if (product.image) images = [product.image];
  }

  imagesBox.innerHTML = "";

  if (images.length > 0) {
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 md:grid-cols-2 gap-3";

    images.forEach((img, idx) => {
      const imgEl = document.createElement("img");
      imgEl.src = img;
      imgEl.alt = `รูปที่ ${idx + 1}`;
      imgEl.className =
        "w-full max-h-64 object-cover rounded-lg border border-gray-200";
      grid.appendChild(imgEl);
    });

    imagesBox.appendChild(grid);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "no-image-placeholder rounded-lg";
    placeholder.textContent = getCategoryIcon(product.category);
    imagesBox.appendChild(placeholder);
  }

  titleEl.textContent = product.product_name;
  descEl.textContent = product.description;
  priceEl.textContent = `฿${parseFloat(product.price).toFixed(2)}`;

  const statusColor = product.status === "มีสินค้า" ? "#10B981" : "#EF4444";
  const statusBg = product.status === "มีสินค้า" ? "#D1FAE5" : "#FEE2E2";
  statusEl.textContent = product.status;
  statusEl.style.background = statusBg;
  statusEl.style.color = statusColor;

  categoryEl.textContent = product.category;
  sellerEl.textContent = product.seller_name;
  contactEl.textContent = product.contact;

  // 🔹 ซ่อนปุ่มรายงานถ้าเป็นโพสต์ของตัวเอง
  const reportProductBtn = document.getElementById("report-product-btn");
  if (reportProductBtn) {
    if (isOwner(product)) {
      reportProductBtn.classList.add("hidden");
    } else {
      reportProductBtn.classList.remove("hidden");
    }
  }

  modal.style.display = "flex";
}

function closeDetailModal() {
  const modal = document.getElementById("product-detail-modal");
  if (modal) modal.style.display = "none";
}

function openReportModal() {
  if (!currentUser) {
    showToast("กรุณาเข้าสู่ระบบก่อนรายงานสินค้า", "error");
    window.location.href = "login.html";
    return;
  }
  if (!productBeingViewedForReport) {
    showToast("ไม่พบข้อมูลสินค้า", "error");
    return;
  }

  // ป้องกันเผื่อโดนเรียกจากโพสต์ตัวเองด้วยวิธีอื่น
  if (isOwner(productBeingViewedForReport)) {
    showToast("ไม่สามารถรายงานโพสต์ของตนเองได้", "error");
    return;
  }

  const modal = document.getElementById("report-modal");
  if (!modal) return;

  document.getElementById("report-product-name").textContent =
    productBeingViewedForReport.product_name;
  document.getElementById("report-seller-name").textContent =
    productBeingViewedForReport.seller_name;

  const reasonSelect = document.getElementById("report-reason");
  const detailInput = document.getElementById("report-detail");
  if (reasonSelect) reasonSelect.value = "";
  if (detailInput) detailInput.value = "";

  modal.style.display = "flex";
}

function closeReportModal() {
  const modal = document.getElementById("report-modal");
  if (modal) modal.style.display = "none";
}

function handleSubmitReport(e) {
  e.preventDefault();

  if (!currentUser) {
    showToast("กรุณาเข้าสู่ระบบก่อนรายงานสินค้า", "error");
    window.location.href = "login.html";
    return;
  }
  if (!productBeingViewedForReport) {
    showToast("ไม่พบข้อมูลสินค้า", "error");
    return;
  }

  // กันพลาดอีกรอบ
  if (isOwner(productBeingViewedForReport)) {
    showToast("ไม่สามารถรายงานโพสต์ของตนเองได้", "error");
    return;
  }

  const reason = document.getElementById("report-reason").value;
  const detail = document.getElementById("report-detail").value.trim();

  if (!reason) {
    showToast("กรุณาเลือกสาเหตุการรายงาน", "error");
    return;
  }

  loadReportsFromStorage();

  const newReport = {
    id: Date.now().toString(),
    productId: productBeingViewedForReport.__backendId,
    product_name: productBeingViewedForReport.product_name,
    seller_name: productBeingViewedForReport.seller_name,
    reporter_name: currentUser.name || "",
    reason,
    detail,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  allReports.push(newReport);
  saveReports();

  showToast("ส่งรายงานเรียบร้อย ขอบคุณที่ช่วยแจ้งให้ทราบ", "success");
  closeReportModal();
}

/* =========================================================
 * 11) INIT
 * =======================================================*/
document.addEventListener("DOMContentLoaded", () => {
  // 1) โหลด session แต่ไม่บังคับว่าต้องมี
  loadSession();

  // 2) ตั้งค่าธีม + header
  applyDefaultStyles();
  updateHeaderUserDisplay();

  // 3) โหลดข้อมูล
  loadProductsFromStorage();
  loadReportsFromStorage();
  renderProducts();

  // 4) อ้างอิง element ต่าง ๆ
  const addProductBtn    = document.getElementById("add-product-btn");
  const closeModalBtn    = document.getElementById("close-modal");
  const cancelBtn        = document.getElementById("cancel-btn");
  const productForm      = document.getElementById("product-form");
  const productImage     = document.getElementById("product-image");
  const searchInput      = document.getElementById("search-input");
  const categoryFilter   = document.getElementById("category-filter");
  const statusFilter     = document.getElementById("status-filter");
  const productModal     = document.getElementById("product-modal");
  const logoutBtn        = document.getElementById("logout-btn");
  const loginHeaderBtn   = document.getElementById("login-header-btn");

  const detailModal      = document.getElementById("product-detail-modal");
  const closeDetailBtn   = document.getElementById("close-detail-modal");

  const reportModal      = document.getElementById("report-modal");
  const closeReportBtn   = document.getElementById("close-report-modal");
  const reportForm       = document.getElementById("report-form");
  const reportProductBtn = document.getElementById("report-product-btn");

  const adminDashboardBtn = document.getElementById("admin-dashboard-btn");

  // ====== ผูก event พื้นฐาน ======
  if (addProductBtn)   addProductBtn.addEventListener("click", openAddModal);
  if (closeModalBtn)   closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn)       cancelBtn.addEventListener("click", closeModal);
  if (productForm)     productForm.addEventListener("submit", handleSubmit);
  if (productImage)    productImage.addEventListener("change", handleImageUpload);
  if (searchInput)     searchInput.addEventListener("input", renderProducts);
  if (categoryFilter)  categoryFilter.addEventListener("change", renderProducts);
  if (statusFilter)    statusFilter.addEventListener("change", renderProducts);

  if (productModal) {
    productModal.addEventListener("click", (e) => {
      if (e.target.id === "product-modal") closeModal();
    });
  }

  // ====== ปุ่มออกจากระบบ ======
  if (logoutBtn) {
    if (!currentUser) {
      logoutBtn.classList.add("hidden");
    } else {
      logoutBtn.classList.remove("hidden");
      logoutBtn.addEventListener("click", () => {
        clearSession();
        window.location.href = "login.html";
      });
    }
  }

  // ✅ ปุ่ม "เข้าสู่ระบบ" บน header
  if (loginHeaderBtn) {
    if (currentUser) {
      loginHeaderBtn.classList.add("hidden");
    } else {
      loginHeaderBtn.classList.remove("hidden");
      loginHeaderBtn.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    }
  }

  // ====== modal รายละเอียดสินค้า ======
  if (detailModal) {
    detailModal.addEventListener("click", (e) => {
      if (e.target.id === "product-detail-modal") {
        closeDetailModal();
      }
    });
  }
  if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", closeDetailModal);
  }

  // ====== modal รายงานโพสต์ ======
  if (reportModal) {
    reportModal.addEventListener("click", (e) => {
      if (e.target.id === "report-modal") {
        closeReportModal();
      }
    });
  }
  if (closeReportBtn) {
    closeReportBtn.addEventListener("click", closeReportModal);
  }
  if (reportForm) {
    reportForm.addEventListener("submit", handleSubmitReport);
  }
  if (reportProductBtn) {
    reportProductBtn.addEventListener("click", openReportModal);
  }

  // ====== ปุ่มแดชบอร์ดแอดมิน ======
  if (adminDashboardBtn) {
    if (isAdmin()) {
      adminDashboardBtn.classList.remove("hidden");
      adminDashboardBtn.addEventListener("click", () => {
        // แดชบอร์ดของคุณชื่อ admin.html
        window.location.href = "admin.html";
      });
    } else {
      adminDashboardBtn.classList.add("hidden");
    }
  }
});
