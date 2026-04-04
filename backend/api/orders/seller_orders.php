<?php
// backend/api/orders/seller_orders.php
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

if (!$db) {
    http_response_code(503);
    echo json_encode(array("status" => 503, "message" => "Database connection failed. Please check if MySQL is running."));
    exit;
}

$seller_id = isset($_GET['seller_id']) ? $_GET['seller_id'] : die();

// Query to fetch orders that contain products belonging to the seller, including customer name
$query = "SELECT o.id, o.status, o.created_at, 
          u.name as customer_name,
          oi.product_id, oi.quantity, oi.price as item_price, 
          p.name as product_name, p.image_url
          FROM orders o 
          JOIN users u ON o.user_id = u.id
          JOIN order_items oi ON o.id = oi.order_id
          JOIN products p ON oi.product_id = p.id
          WHERE p.seller_id = :seller_id 
          ORDER BY o.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(":seller_id", $seller_id);
$stmt->execute();

$orders = array();

while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    $order_id = $row['id'];
    
    if(!isset($orders[$order_id])){
        $orders[$order_id] = array(
            "id" => $order_id,
            "total_amount" => 0, // We will calculate this based on seller's items only
            "status" => $row['status'],
            "created_at" => $row['created_at'],
            "customer_name" => $row['customer_name'],
            "items" => array()
        );
    }
    
    // Add this item's subtotal to the seller's specific order total
    $item_subtotal = $row['quantity'] * $row['item_price'];
    $orders[$order_id]['total_amount'] += $item_subtotal;
    
    array_push($orders[$order_id]['items'], array(
        "product_id" => $row['product_id'],
        "product_name" => $row['product_name'],
        "image_url" => $row['image_url'],
        "quantity" => $row['quantity'],
        "item_price" => $row['item_price']
    ));
}

// Convert associative array to numeric array
$orders_arr = array_values($orders);

// Always return 200 OK with an array, even if empty
http_response_code(200);
if(count($orders_arr) > 0){
    echo json_encode(array("status" => 200, "body" => $orders_arr));
} else {
    echo json_encode(array("status" => 200, "body" => [], "message" => "No orders found."));
}
?>
