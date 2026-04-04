<?php
// backend/api/reviews/create.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/Review.php';

$database = new Database();
$db = $database->getConnection();

$review = new Review($db);

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->user_id) &&
    !empty($data->product_id) &&
    isset($data->rating) &&
    !empty($data->comment)
){
    $review->user_id = $data->user_id;
    $review->product_id = $data->product_id;
    $review->rating = $data->rating;
    $review->comment = $data->comment;

    $result = $review->create();

    if($result === true){
        http_response_code(201);
        echo json_encode(array("message" => "Review was created."));
    } else if($result === "ALREADY_REVIEWED"){
        http_response_code(400);
        echo json_encode(array("message" => "You have already reviewed this product."));
    } else if($result === "NOT_PURCHASED"){
        http_response_code(403);
        echo json_encode(array("message" => "Only verified purchasers can review this product."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create review."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create review. Data is incomplete."));
}
?>
