<?php
// backend/api/coupons/manage.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/CouponController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new CouponController($db);

$method = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents("php://input");
$data = !empty($input) ? json_decode($input) : null;

$response = array("status" => 405, "body" => array("message" => "Method not allowed"));

if ($method === 'POST') {
    // Check if JSON body or POST form data
    if($data) {
        $response = $controller->create((array)$data);
    } else {
        $response = $controller->create($_POST);
    }
}

http_response_code($response['status']);
echo json_encode($response['body']);
?>
