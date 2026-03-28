<?php
// backend/api/wishlist/read.php
include_once '../../config/cors.php';
include_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

$query = "SELECT p.*, w.created_at as added_at 
          FROM wishlist w 
          JOIN products p ON w.product_id = p.id 
          WHERE w.user_id = ? 
          ORDER BY w.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(1, $user_id);
$stmt->execute();

$num = $stmt->rowCount();

if($num >= 0){ // Retrieve even if empty
    $products_arr = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        extract($row);
        
        $product_item = array(
            "id" => $id,
            "name" => $name,
            "description" => html_entity_decode($description),
            "price" => $price,
            "category" => $category,
            "image_url" => $image_url,
            "sizes" => json_decode($sizes),
            "colors" => json_decode($colors),
            "added_at" => $added_at
        );
        
        array_push($products_arr, $product_item);
    }
    
    http_response_code(200);
    echo json_encode($products_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No wishlist found."));
}
?>
