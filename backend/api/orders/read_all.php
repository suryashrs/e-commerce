<?php
// backend/api/orders/read_all.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT o.id, o.total_amount, o.status, o.created_at, u.name 
          FROM orders o 
          JOIN users u ON o.user_id = u.id 
          ORDER BY o.created_at DESC";

$stmt = $db->prepare($query);
$stmt->execute();

$orders_arr = array();

while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
    array_push($orders_arr, $row);
}

http_response_code(200);
echo json_encode($orders_arr);
?>
