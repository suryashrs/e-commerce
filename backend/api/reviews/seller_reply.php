<?php
// backend/api/reviews/seller_reply.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../src/Config/Database.php';
include_once '../../src/Models/Review.php';

$database = new Database();
$db = $database->getConnection();

$review = new Review($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->review_id) && !empty($data->seller_id) && !empty($data->reply)){
    if($review->addSellerReply($data->review_id, $data->seller_id, $data->reply)){
        http_response_code(200);
        echo json_encode(array("message" => "Reply added successfully."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to add reply. You might not own this product or the review doesn't exist."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. review_id, seller_id, and reply are required."));
}
?>
