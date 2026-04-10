<?php
// backend/api/checkout/esewa_verify.php
include_once '../../src/Config/Database.php';
include_once '../../src/Services/EsewaService.php';

$database = new Database();
$db = $database->getConnection();
$esewaService = new EsewaService();

// eSewa sends back the result in a 'data' parameter (Base64 encoded JSON)
$data = $_GET['data'] ?? '';

if (empty($data)) {
    die("Error: No data received from eSewa.");
}

$verification = $esewaService->verifyPayment($data);

if ($verification['success']) {
    $decodedData = $verification['data'];
    $transaction_uuid = $decodedData['transaction_uuid'];
    
    // Extract order_id from transaction_uuid (format: orderId-timestamp)
    $order_id = explode('-', $transaction_uuid)[0];
    
    // Update order status in database
    $query = "UPDATE orders SET status = 'completed' WHERE id = :order_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":order_id", $order_id);
    
    if ($stmt->execute()) {
        // Redirect to a frontend success page (Buyer Dashboard)
        $frontendUrl = "http://localhost:5173/buyer"; 
        header("Location: $frontendUrl?payment=success&order_id=$order_id");
        exit;
    } else {
        die("Error updating order status.");
    }
} else {
    // Payment failed or signature mismatch
    die("Payment verification failed: " . ($verification['message'] ?? 'Unknown error'));
}
?>
