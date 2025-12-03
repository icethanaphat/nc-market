const USERS_KEY = "school_market_users";
const SESSION_KEY = "school_market_current_user";

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("โหลด users ไม่ได้", e);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("บันทึก users ไม่ได้", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ถ้ามี session อยู่แล้ว → เด้งไป index
  const rawSession = localStorage.getItem(SESSION_KEY);
  if (rawSession) {
    window.location.href = "index.html";
    return;
  }

  const form = document.getElementById("register-form");
  const firstNameInput = document.getElementById("first-name");
  const lastNameInput = document.getElementById("last-name");
  const studentIdInput = document.getElementById("student-id");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const majorInput = document.getElementById("major");
  const levelInput = document.getElementById("level");
  const cardImageInput = document.getElementById("card-image");
  const previewBox = document.getElementById("card-preview");
  const previewImg = document.getElementById("card-preview-img");
  const errorBox = document.getElementById("register-error");

  let cardImageData = ""; // base64

  function clearError() {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
    errorBox.classList.remove("text-red-500", "text-green-600");

    [
      firstNameInput,
      lastNameInput,
      studentIdInput,
      passwordInput,
      confirmPasswordInput,
      majorInput,
      levelInput,
      cardImageInput
    ].forEach((el) => {
      el.classList.remove("border-red-500", "bg-red-50");
    });
  }

  function setError(message, fields = []) {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
    errorBox.classList.remove("text-green-600");
    errorBox.classList.add("text-red-500");
    fields.forEach((el) => {
      el.classList.add("border-red-500", "bg-red-50");
    });
  }

  // พรีวิวรูปบัตรนักเรียน
  cardImageInput.addEventListener("change", () => {
    const file = cardImageInput.files[0];
    if (!file) {
      cardImageData = "";
      previewBox.classList.add("hidden");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      cardImageData = e.target.result;
      previewImg.src = cardImageData;
      previewBox.classList.remove("hidden");
    };
    reader.onerror = function () {
      cardImageData = "";
      previewBox.classList.add("hidden");
      setError("ไม่สามารถอ่านไฟล์รูปได้", [cardImageInput]);
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const studentId = studentIdInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const major = majorInput.value;
    const level = levelInput.value;

    // ตรวจช่องว่าง
    const missing = [];
    if (!firstName) missing.push(firstNameInput);
    if (!lastName) missing.push(lastNameInput);
    if (!studentId) missing.push(studentIdInput);
    if (!password) missing.push(passwordInput);
    if (!confirmPassword) missing.push(confirmPasswordInput);
    if (!major) missing.push(majorInput);
    if (!level) missing.push(levelInput);

    if (missing.length > 0) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง", missing);
      return;
    }

    // ตรวจรหัสบัตร 11 หลัก
    const idPattern = /^\d{11}$/;
    if (!idPattern.test(studentId)) {
      setError("รหัสบัตรนักเรียนต้องเป็นตัวเลข 11 หลัก", [studentIdInput]);
      return;
    }

    // ตรวจความยาวรหัสผ่าน
    if (password.length < 6) {
      setError("รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร", [passwordInput]);
      return;
    }

    // ตรวจรหัสผ่านตรงกันไหม
    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน", [
        passwordInput,
        confirmPasswordInput
      ]);
      return;
    }

    // ตรวจว่ามีรูปแล้วหรือยัง
    if (!cardImageData) {
      setError("กรุณาอัปโหลดรูปบัตรนักเรียน", [cardImageInput]);
      return;
    }

    const users = loadUsers();
    const existed = users.find((u) => u.studentId === studentId);
    if (existed) {
      setError(
        "มีรหัสบัตรนักเรียนนี้ในระบบแล้ว โปรดใช้รหัสอื่นหรือลองเข้าสู่ระบบ",
        [studentIdInput]
      );
      return;
    }

    // หมายเหตุ: ในโลกจริงควร hash password ก่อนเก็บ
    const newUser = {
      studentId,
      firstName,
      lastName,
      password, // เก็บ plain text ไว้ใช้ในโครงงาน (อธิบายในเล่มได้ว่า ถ้าทำจริงควรเข้ารหัส)
      major,
      level,
      cardImage: cardImageData,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    errorBox.textContent = "สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...";
    errorBox.classList.remove("hidden");
    errorBox.classList.remove("text-red-500");
    errorBox.classList.add("text-green-600");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
  });
});
