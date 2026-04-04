<?php
// backend/api/orders/update_status.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/OrderController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new OrderController($db);
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->order_id) && !empty($data->status)) {
    $response = $controller->updateStatus($data->order_id, $data->status);
    http_response_code($response['status']);
    echo json_encode($response['body']);
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Order ID and status are required."));
}
?>
