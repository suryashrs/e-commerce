<?php
// backend/api/points/redeem.php
include_once '../../config/cors.php';
include_once '../../src/Services/FirestoreService.php';
include_once '../../src/Config/Database.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents("php://input");
$data = !empty($input) ? json_decode($input) : null;

if ($method === 'POST') {
    if(!empty($data->user_id) && !empty($data->coupon_id) && !empty($data->cost)) {
        
        $firestore = new FirestoreService();
        $currentBalance = $firestore->getUserPoints($data->user_id);
        
        if ($currentBalance >= $data->cost) {
            // Deduct from Firestore
            $success = $firestore->deductPoints($data->user_id, $data->cost);
            
            if ($success) {
                // Update the usage count in MySQL for that coupon
                $database = new Database();
                $db = $database->getConnection();
                $stmt = $db->prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE id = :id");
                $stmt->bindParam(":id", $data->coupon_id);
                $stmt->execute();
                
                http_response_code(200);
                echo json_encode([
                    "status" => 200, 
                    "body" => ["message" => "Coupon redeemed successfully!", "newBalance" => $currentBalance - $data->cost]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => 500, "body" => ["message" => "Failed to deduct points in Firestore."]]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => 400, "body" => ["message" => "Insufficient TrendPoints."]]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => 400, "body" => ["message" => "Incomplete request."]]);
    }
}
?>
