<?php
// backend/api/orders/user_orders.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

// Updated query to fetch orders with items and product details
$query = "SELECT o.id, o.total_amount, o.status, o.created_at, 
          oi.product_id, oi.quantity, oi.price as item_price, 
          p.name as product_name, p.image_url, p.is_flagged
          FROM orders o 
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE o.user_id = :user_id 
          ORDER BY o.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $user_id);
$stmt->execute();

$orders = array();

while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $order_id = $row['id'];
    
    if(!isset($orders[$order_id])){
        $orders[$order_id] = array(
            "id" => $order_id,
            "total_amount" => $row['total_amount'],
            "status" => $row['status'],
            "created_at" => $row['created_at'],
            "items" => array()
        );
    }
    
    if($row['product_id']){
        array_push($orders[$order_id]['items'], array(
            "product_id" => $row['product_id'],
            "product_name" => $row['product_name'],
            "image_url" => $row['image_url'],
            "quantity" => $row['quantity'],
            "item_price" => $row['item_price'],
            "is_flagged" => (bool)($row['is_flagged'] ?? 0)
        ));
    }
}

// Convert associative array to numeric array
$orders_arr = array_values($orders);

// Always return 200 OK with an array, even if empty, for better frontend handling
http_response_code(200);
if(count($orders_arr) > 0){
    echo json_encode(array("status" => 200, "body" => $orders_arr));
} else {
    echo json_encode(array("status" => 200, "body" => [], "message" => "No orders found."));
}
?>
