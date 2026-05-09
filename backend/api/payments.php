<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../src/Config/Database.php';
include_once '../src/Controllers/PaymentController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new PaymentController($db);

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$role = isset($_GET['role']) ? $_GET['role'] : 'buyer';

if (!$userId) {
    echo json_encode(["message" => "User ID is required."]);
    exit;
}

$response = $controller->getPaymentHistory($userId, $role);
http_response_code($response['status']);
echo json_encode($response['body']);
?>
