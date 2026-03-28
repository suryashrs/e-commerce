<?php
// backend/api/points/balance.php
include_once '../../config/cors.php';
include_once '../../src/Services/FirestoreService.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && isset($_GET['user_id'])) {
    $userId = (int) $_GET['user_id'];
    
    $firestore = new FirestoreService();
    $balance = $firestore->getUserPoints($userId);
    
    http_response_code(200);
    echo json_encode([
        "status" => 200, 
        "body" => [
            "pointsBalance" => $balance,
            "nextTierAt" => 2000 // Just a fun logic addition for the progress bar
        ]
    ]);
} else {
    http_response_code(400);
    echo json_encode(["status" => 400, "message" => "Missing user_id parameter."]);
}
?>
