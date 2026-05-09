<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../src/Config/Database.php';
require_once '../../src/Models/Notification.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $query = "DELETE FROM notifications WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Notification deleted successfully."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to delete notification."));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Internal server error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. Notification ID required."));
}
?>
