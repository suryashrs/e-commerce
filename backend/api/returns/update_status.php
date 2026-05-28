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
include_once '../../src/Models/Transaction.php';

$database = new Database();
$db = $database->getConnection();

$returnRequest = new ReturnRequest($db);
$transaction = new Transaction($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->status)) {
    // Get the return request details first
    $req = $returnRequest->getById($data->id);
    if(!$req) {
        http_response_code(404);
        echo json_encode(["message" => "Return request not found."]);
        exit();
    }

    if($returnRequest->updateStatus($data->id, $data->status)) {
        
        // If marked as refunded, create negative transaction
        if(strtolower($data->status) === 'refunded' && strtolower($req['status']) !== 'refunded') {
            $amount = $req['price'] * $req['quantity'];
            
            $transaction->seller_id = $req['seller_id'];
            $transaction->order_id = $req['order_id'];
            $transaction->amount = -$amount; // Negative amount
            $transaction->platform_commission = -($amount * 0.10); // Reverse commission
            $transaction->create();
        }

        // Create website notification for buyer
        include_once '../../src/Models/Notification.php';
        $notification = new Notification($db);
        $notification->user_id = $req['user_id'];
        $notification->related_id = $req['order_id'];
        $notification->type = 'RETURN_STATUS';
        $notification->message = "Your return request for Order #" . substr((string)$req['order_id'], 0, 8) . " is now " . $data->status;
        $notification->create();

        // Fetch buyer email and send email notification
        require_once '../../src/Services/NotificationService.php';
        $stmt = $db->prepare("SELECT email FROM users WHERE id = :id");
        $stmt->bindParam(':id', $req['user_id']);
        $stmt->execute();
        $buyer = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($buyer && !empty($buyer['email'])) {
            NotificationService::sendReturnStatusBuyerEmail($buyer['email'], $req['order_id'], $data->status);
        }

        http_response_code(200);
        echo json_encode(["message" => "Return request status updated."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update return request status."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Unable to update status. Data is incomplete."]);
}
?>
