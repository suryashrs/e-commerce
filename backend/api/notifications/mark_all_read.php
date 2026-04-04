<?php
// backend/api/notifications/mark_all_read.php
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

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id)) {
    $query = "UPDATE notifications SET is_read = 1 WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $data->user_id);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("status" => 200, "message" => "All notifications marked as read."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to mark all as read."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. User ID missing."));
}
?>
