<?php
// backend/api/admin/approve_seller.php
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
include_once '../../src/Models/User.php';
include_once '../../src/Models/Notification.php';
include_once '../../src/Models/ActivityLog.php';
include_once '../../src/Controllers/AdminController.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $controller = new AdminController($db);
    if($controller->approveSeller($data->id, $data->admin_id ?? null)) {
        // Also notify the seller!
        $notification = new Notification($db);
        $notification->user_id = $data->id;
        $notification->type = 'SYSTEM_UPDATE';
        $notification->message = "Congratulations! Your seller account has been approved. You can now start listing products.";
        $notification->create();

        http_response_code(200);
        echo json_encode(["message" => "Seller approved successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to approve seller."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Seller ID is required."]);
}
?>
