<?php
// backend/api/admin/stats.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

$stats = array();

// Total Products
$query = "SELECT count(*) as total_products FROM products";
$stmt = $db->prepare($query);
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$stats['total_products'] = $row['total_products'];

// Total Orders
$query = "SELECT count(*) as total_orders FROM orders";
$stmt = $db->prepare($query);
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$stats['total_orders'] = $row['total_orders'];

// Total Sales
$query = "SELECT SUM(total_amount) as total_sales FROM orders";
$stmt = $db->prepare($query);
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$stats['total_sales'] = $row['total_sales'] ? $row['total_sales'] : 0;

// Recent Orders (Last 5)
$query = "SELECT o.id, o.total_amount, o.created_at, u.name 
          FROM orders o 
          JOIN users u ON o.user_id = u.id 
          ORDER BY o.created_at DESC LIMIT 5";
$stmt = $db->prepare($query);
$stmt->execute();
$recent_orders = array();
while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    array_push($recent_orders, $row);
}
$stats['recent_orders'] = $recent_orders;

http_response_code(200);
echo json_encode($stats);
?>
