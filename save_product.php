<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

require 'db.php';

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(["error" => "invalid json"]);
    exit;
}

$backendId   = $input["__backendId"] ?? null;
$productName = $input["product_name"] ?? "";
$price       = $input["price"] ?? 0;
$quantity    = $input["quantity"] ?? 0;
$category    = $input["category"] ?? "";
$description = $input["description"] ?? "";
$sellerName  = $input["seller_name"] ?? "";
$contact     = $input["contact"] ?? "";
$images      = $input["images"] ?? "[]";
$status      = $input["status"] ?? "มีสินค้า";
$createdAt   = $input["created_at"] ?? date("Y-m-d H:i:s");

if (!$backendId) {
    $backendId = time();  // กันพลาด
}

// เช็คว่ามี backend_id นี้แล้วไหม
$stmt = $conn->prepare("SELECT id FROM products WHERE backend_id = ?");
$stmt->bind_param("s", $backendId);
$stmt->execute();
$stmt->store_result();
$exists = $stmt->num_rows > 0;
$stmt->close();

if ($exists) {
    // UPDATE
    $stmt = $conn->prepare("UPDATE products
        SET product_name=?, price=?, quantity=?, category=?, description=?,
            seller_name=?, contact=?, images=?, status=?
        WHERE backend_id=?");
    $stmt->bind_param(
        "sdisssssss",
        $productName, $price, $quantity, $category, $description,
        $sellerName, $contact, $images, $status, $backendId
    );
} else {
    // INSERT
    $stmt = $conn->prepare("INSERT INTO products
        (backend_id, product_name, price, quantity, category, description,
         seller_name, contact, images, status, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param(
        "ssdiissssss",
        $backendId, $productName, $price, $quantity, $category, $description,
        $sellerName, $contact, $images, $status, $createdAt
    );
}

if ($stmt->execute()) {
    echo json_encode(["ok" => true, "__backendId" => $backendId]);
} else {
    http_response_code(500);
    echo json_encode(["error" => $stmt->error]);
}
$stmt->close();
$conn->close();
