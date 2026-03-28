<?php
// backend/api/orders/create.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/OrderController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new OrderController($db);
$data = json_decode(file_get_contents("php://input"));

$response = $controller->create($data);

http_response_code($response['status']);
echo json_encode($response['body']);
?>
