<?php
// backend/api/notifications/user_notifications.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../src/Config/Database.php';
include_once '../../src/Models/Notification.php';

$database = new Database();
$db = $database->getConnection();

$notification = new Notification($db);

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

$stmt = $notification->readByUser($user_id);
$num = $stmt->rowCount();

$notifications_arr = array();

// Also count unread
$unread_count = 0;

if($num > 0){
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        extract($row);
        $notification_item = array(
            "id" => $id,
            "related_id" => $related_id,
            "type" => $type,
            "message" => html_entity_decode($message),
            "is_read" => (bool)$is_read,
            "created_at" => $created_at
        );
        array_push($notifications_arr, $notification_item);
        if (!$is_read) {
            $unread_count++;
        }
    }
}

http_response_code(200);
echo json_encode(array(
    "status" => 200, 
    "body" => $notifications_arr,
    "unread_count" => $unread_count
));
?>
