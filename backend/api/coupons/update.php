<?php
// backend/api/coupons/update.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/CouponController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new CouponController($db);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PUT' || $method === 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $response = $controller->update($data);
} else {
    $response = array("status" => 405, "body" => array("message" => "Method not allowed"));
}

http_response_code($response['status']);
echo json_encode($response['body']);
?>
