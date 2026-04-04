<?php
// backend/api/admin/flag_product.php
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
include_once '../../src/Models/Product.php';
include_once '../../src/Models/ActivityLog.php';
include_once '../../src/Controllers/AdminController.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $controller = new AdminController($db);
    if($controller->toggleProductFlag($data->id, $data->admin_id ?? null)) {
        http_response_code(200);
        echo json_encode(["message" => "Product flag toggled successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to toggle product flag."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Product ID is required."]);
}
?>
