<?php
// backend/api/admin/user_update.php
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
    $name = !empty($data->name) ? $data->name : "";
    $email = !empty($data->email) ? $data->email : "";
    $role = !empty($data->role) ? $data->role : "buyer";
    $shop_status = !empty($data->shop_status) ? $data->shop_status : "approved";
    
    // Update the user
    $query = "UPDATE users SET name = :name, email = :email, role = :role, shop_status = :shop_status WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':role', $role);
    $stmt->bindParam(':shop_status', $shop_status);
    $stmt->bindParam(':id', $id);
    
    if($stmt->execute()){
         http_response_code(200);
         echo json_encode(array("message" => "User updated successfully.", "status" => 200));
    } else {
         http_response_code(500);
         echo json_encode(array("message" => "Unable to update user. Please try again.", "status" => 500));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid ID.", "status" => 400));
}
?>
