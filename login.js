// login.js

const SESSION_KEY = "school_market_current_user";
const USERS_KEY   = "school_market_users"; // ถ้ามี register เก็บผู้ใช้ไว้ใน key นี้

// ✅ ตั้งค่าบัญชีแอดมินลับ (มีแค่คุณรู้)
// แนะนำให้เปลี่ยน 2 บรรทัดนี้เป็นของคุณเอง
const ADMIN_USERNAME = "myAdmin";      // ชื่อผู้ใช้แอดมินลับ
const ADMIN_PASSWORD = "Admin@1234";   // รหัสผ่านแอดมินลับ

document.addEventListener("DOMContentLoaded", () => {
  const form          = document.getElementById("login-form");
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const errorBox      = document.getElementById("login-error");

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    errorBox.classList.add("text-red-600", "bg-red-50", "border", "border-red-200", "px-3", "py-2", "rounded-lg");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError("กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ");
      return;
    }

    let loggedInUser = null;

    // 1) เช็คก่อนว่าเป็นแอดมินลับไหม
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      loggedInUser = {
        name: "ผู้ดูแลระบบ",
        role: "admin",
        login_at: new Date().toISOString(),
      };
    } else {
      // 2) ถ้าไม่ใช่แอดมิน → ลองเช็คจากข้อมูลผู้ใช้ที่สมัครไว้ (localStorage)
      let users = [];
      try {
        const raw = localStorage.getItem(USERS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) users = parsed;
        }
      } catch (e) {
        console.error("อ่านข้อมูลผู้ใช้ไม่ได้", e);
      }

      // สมมุติว่าเก็บ structure ประมาณนี้ใน register:
      // { studentId, fullName, password, classRoom, ... }
      const foundUser = users.find(
        (u) =>
          (u.studentId === username || u.username === username) &&
          u.password === password
      );

      if (!foundUser) {
        showError("ไม่พบบัญชีผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      loggedInUser = {
        name: foundUser.fullName || foundUser.username || foundUser.studentId,
        role: foundUser.role || "student",
        studentId: foundUser.studentId,
        login_at: new Date().toISOString(),
      };
    }

    // 3) เซฟ session และเด้งหน้าเว็บ
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    } catch (e) {
      console.error("บันทึก session ไม่ได้", e);
    }

    // 4) เด้งตาม role
    if (loggedInUser.role === "admin") {
      // ถ้าคุณมีหน้าแดชบอร์ดแอดมิน
      window.location.href = "admin.html";
    } else {
      // ผู้ใช้งานทั่วไป
      window.location.href = "index.html";
    }
  });
});
