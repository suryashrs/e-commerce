<?php
// backend/api/reviews/delete.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/Review.php';

$database = new Database();
$db = $database->getConnection();

$review = new Review($db);

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->id) &&
    !empty($data->user_id)
){
    $review->id = $data->id;
    $review->user_id = $data->user_id;

    if($review->delete()){
        http_response_code(200);
        echo json_encode(array("message" => "Review was deleted."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to delete review."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to delete review. Data is incomplete."));
}
?>
