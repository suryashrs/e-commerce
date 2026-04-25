<?php
// backend/api/reviews/read.php
include_once '../../config/cors.php';

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

include_once '../../src/Config/Database.php';
include_once '../../src/Models/Review.php';

$database = new Database();
$db = $database->getConnection();

$review = new Review($db);

$product_id = isset($_GET['product_id']) ? $_GET['product_id'] : die();
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'latest';
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

$stmt = $review->readByProduct($product_id, $sort);
$num = $stmt->rowCount();

$can_review = false;
if ($user_id) {
    $can_review = $review->hasPurchased($user_id, $product_id);
}

if($num > 0){
    $reviews_arr = array();
    $reviews_arr["records"] = array();
    $reviews_arr["stats"] = $review->getAverageRating($product_id);
    $reviews_arr["can_review"] = $can_review;

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        extract($row);
        $review_item = array(
            "id" => $id,
            "user_id" => $user_id,
            "user_name" => $user_name,
            "product_id" => $product_id,
            "rating" => $rating,
            "comment" => html_entity_decode($comment),
            "seller_reply" => $seller_reply ? html_entity_decode($seller_reply) : null,
            "seller_reply_at" => $seller_reply_at,
            "created_at" => $created_at
        );
        array_push($reviews_arr["records"], $review_item);
    }

    http_response_code(200);
    echo json_encode($reviews_arr);
} else {
    http_response_code(200); // Return empty array instead of 404 for easier frontend handling
    echo json_encode(array("records" => [], "stats" => ["avg_rating" => 0, "review_count" => 0], "can_review" => $can_review));
}
?>
