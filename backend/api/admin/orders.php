<?php
// backend/api/admin/orders.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(503);
    echo json_encode(["message" => "Database connection failed."]);
    exit;
}

// Fetch all orders with buyer info
$query = "SELECT o.id, o.status, o.created_at, o.total_amount,
          o.shipping_address, o.payment_method,
          u.name as customer_name, u.email as customer_email
          FROM orders o
          JOIN users u ON o.user_id = u.id
          ORDER BY o.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();
$orders_raw = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch items for each order
$orders = [];
foreach ($orders_raw as $order) {
    $item_query = "SELECT oi.product_id, oi.quantity, oi.price as item_price,
                   p.name as product_name, p.image_url
                   FROM order_items oi
                   JOIN products p ON oi.product_id = p.id
                   WHERE oi.order_id = :order_id";
    $item_stmt = $db->prepare($item_query);
    $item_stmt->bindParam(':order_id', $order['id']);
    $item_stmt->execute();
    $order['items'] = $item_stmt->fetchAll(PDO::FETCH_ASSOC);
    $order['payment_method'] = $order['payment_method'] ?? 'cod';
    $orders[] = $order;
}

http_response_code(200);
echo json_encode(["status" => 200, "body" => $orders]);
?>
