<?php
// backend/api/reviews/seller_reviews.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/Review.php';

$database = new Database();
$db = $database->getConnection();

$review = new Review($db);

$seller_id = isset($_GET['seller_id']) ? $_GET['seller_id'] : die();

$stmt = $review->readForSeller($seller_id);
$num = $stmt->rowCount();

if($num > 0){
    $reviews_arr = array();
    $reviews_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        extract($row);
        $review_item = array(
            "id" => $id,
            "user_id" => $user_id,
            "user_name" => $user_name,
            "product_id" => $product_id,
            "product_name" => $product_name,
            "rating" => $rating,
            "comment" => html_entity_decode($comment),
            "seller_reply" => $seller_reply ? html_entity_decode($seller_reply) : null,
            "seller_reply_at" => $seller_reply_at,
            "status" => $status,
            "created_at" => $created_at
        );
        array_push($reviews_arr["records"], $review_item);
    }

    http_response_code(200);
    echo json_encode($reviews_arr);
} else {
    http_response_code(200);
    echo json_encode(array("records" => []));
}
?>
