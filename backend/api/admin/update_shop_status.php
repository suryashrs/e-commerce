<?php
// backend/api/admin/update_shop_status.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->status)) {
    if ($user->updateShopStatus($data->id, $data->status)) {
        
        // If approved, notify the seller
        if ($data->status === 'approved') {
            include_once '../../src/Models/Notification.php';
            $notification = new Notification($db);
            $notification->user_id = $data->id;
            $notification->type = 'SYSTEM_UPDATE';
            $notification->message = "Congratulations! Your seller account has been approved. You can now start listing products.";
            $notification->create();
        }

        http_response_code(200);
        echo json_encode(["message" => "Shop status updated successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Unable to update shop status."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. User ID and status are required."]);
}
?>
