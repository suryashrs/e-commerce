<?php
// backend/api/coupons/delete.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/CouponController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new CouponController($db);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    $response = $controller->delete($id);
} else {
    $response = array("status" => 405, "body" => array("message" => "Method not allowed"));
}

http_response_code($response['status']);
echo json_encode($response['body']);
?>
