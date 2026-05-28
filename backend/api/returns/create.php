<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../src/Config/Database.php';
include_once '../../src/Models/ReturnRequest.php';

$database = new Database();
$db = $database->getConnection();

$returnRequest = new ReturnRequest($db);

// Since frontend sends FormData (multipart/form-data), we must read from $_POST instead of php://input
$order_id = isset($_POST['order_id']) ? $_POST['order_id'] : null;
$order_item_id = isset($_POST['order_item_id']) ? $_POST['order_item_id'] : null;
$user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;
$seller_id = isset($_POST['seller_id']) ? $_POST['seller_id'] : null;
$reason = isset($_POST['reason']) ? $_POST['reason'] : null;

if(!empty($order_id) && !empty($order_item_id) && !empty($user_id) && !empty($seller_id) && !empty($reason)) {
    $returnRequest->order_id = $order_id;
    $returnRequest->order_item_id = $order_item_id;
    $returnRequest->user_id = $user_id;
    $returnRequest->seller_id = $seller_id;
    $returnRequest->reason = $reason;
    $returnRequest->image_url = null;

    // Handle image upload if provided
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = '../../uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        $file_name = time() . '_' . basename($_FILES['image']['name']);
        $target_path = $upload_dir . $file_name;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $target_path)) {
            // Need to return a URL that the frontend can access
            $returnRequest->image_url = 'http://localhost/e-commerce/backend/uploads/' . $file_name;
        }
    }

    if($returnRequest->create()){
        // Create website notification for seller
        include_once '../../src/Models/Notification.php';
        $notification = new Notification($db);
        $notification->user_id = $seller_id;
        $notification->related_id = $order_id;
        $notification->type = 'RETURN_REQUEST';
        $notification->message = "New return request for Order #" . substr((string)$order_id, 0, 8);
        $notification->create();

        // Fetch seller email and send email notification
        require_once '../../src/Services/NotificationService.php';
        $stmt = $db->prepare("SELECT email FROM users WHERE id = :id");
        $stmt->bindParam(':id', $seller_id);
        $stmt->execute();
        $seller = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($seller && !empty($seller['email'])) {
            NotificationService::sendReturnRequestSellerEmail($seller['email'], $order_id);
        }

        http_response_code(201);
        echo json_encode(["status" => 201, "body" => ["message" => "Return request created successfully."]]);
    } else{
        http_response_code(503);
        echo json_encode(["status" => 503, "body" => ["message" => "Unable to create return request."]]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => 400, "body" => ["message" => "Unable to create return request. Data is incomplete."]]);
}
?>
