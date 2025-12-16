<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

require 'db.php';

$sql = "SELECT * FROM products ORDER BY id DESC";
$result = $conn->query($sql);

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = [
        "__backendId"   => $row["backend_id"],
        "product_name"  => $row["product_name"],
        "price"         => (float)$row["price"],
        "quantity"      => (int)$row["quantity"],
        "category"      => $row["category"],
        "description"   => $row["description"],
        "seller_name"   => $row["seller_name"],
        "contact"       => $row["contact"],
        "images"        => $row["images"],
        "status"        => $row["status"],
        "created_at"    => $row["created_at"],
    ];
}

echo json_encode($products);
$conn->close();
