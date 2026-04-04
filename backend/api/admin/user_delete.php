<?php
// backend/api/admin/user_delete.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)){
    $id = $data->id;
    
    // Check if the user exists
    $query = "SELECT id FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    
    if($stmt->rowCount() > 0){
        // Delete the user
        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if($stmt->execute()){
            http_response_code(200);
            echo json_encode(array("message" => "User deleted successfully.", "status" => 200));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Unabe to delete user. Please try again.", "status" => 500));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "User not found.", "status" => 404));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid ID.", "status" => 400));
}
?>
