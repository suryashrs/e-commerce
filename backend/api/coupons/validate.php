<?php
// backend/api/coupons/validate.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/CouponController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new CouponController($db);

$code = isset($_GET['code']) ? $_GET['code'] : null;

$response = $controller->validate($code);

http_response_code($response['status']);
echo json_encode($response['body']);
?>
