<?php
$host = "localhost";
$user = "YOUR_DB_USER";      // แก้เป็น user ของโฮสต์/localhost
$pass = "YOUR_DB_PASSWORD";  // แก้เป็นรหัสผ่าน
$db   = "school_market";     // ถ้าใช้ชื่ออื่น แก้ให้ตรง

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    die("เชื่อมต่อฐานข้อมูลไม่ได้: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>
