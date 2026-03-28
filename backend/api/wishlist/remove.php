<?php
// backend/api/wishlist/remove.php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->user_id) && !empty($data->product_id)){
    $query = "DELETE FROM wishlist WHERE user_id = :user_id AND product_id = :product_id";
    $stmt = $db->prepare($query);

    $stmt->bindParam(":user_id", $data->user_id);
    $stmt->bindParam(":product_id", $data->product_id);

    if($stmt->execute()){
        http_response_code(200);
        echo json_encode(array("message" => "Product removed from wishlist."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to remove product from wishlist."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to remove from wishlist. Data is incomplete."));
}
?>
