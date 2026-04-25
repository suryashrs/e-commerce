<?php
// backend/api/reviews/admin_delete.php
include_once __DIR__ . '/../../config/cors.php';

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

include_once __DIR__ . '/../../src/Config/Database.php';
include_once __DIR__ . '/../../src/Models/Review.php';

$database = new Database();
$db = $database->getConnection();

$review = new Review($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->review_id) && !empty($data->admin_id)){
    if($review->adminSoftDelete($data->review_id, $data->admin_id)){
        http_response_code(200);
        echo json_encode(array("message" => "Review marked as deleted and action logged."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to delete review."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. review_id and admin_id are required."));
}
?>
