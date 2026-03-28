<?php
// backend/api/wishlist/add.php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->user_id) && !empty($data->product_id)){
    // Check if user exists
    $check_user = $db->prepare("SELECT id FROM users WHERE id = :user_id");
    $check_user->bindParam(":user_id", $data->user_id);
    $check_user->execute();
    if($check_user->rowCount() == 0){
        http_response_code(404);
        echo json_encode(array("message" => "User not found."));
        exit();
    }

    $query = "INSERT INTO wishlist SET user_id=:user_id, product_id=:product_id";
    $stmt = $db->prepare($query);

    $stmt->bindParam(":user_id", $data->user_id);
    $stmt->bindParam(":product_id", $data->product_id);

    try {
        if($stmt->execute()){
            http_response_code(201);
            echo json_encode(array("message" => "Product added to wishlist."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to add product to wishlist."));
        }
    } catch(PDOException $e) {
        if($e->errorInfo[1] == 1062) { // Duplicate entry
            http_response_code(400);
            echo json_encode(array("message" => "Product already in wishlist."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to add product to wishlist."));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add to wishlist. Data is incomplete."));
}
?>
