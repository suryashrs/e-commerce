<?php
// backend/api/coupons/read.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/CouponController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new CouponController($db);
$response = $controller->index();

http_response_code($response['status']);
echo json_encode($response['body']);
?>
