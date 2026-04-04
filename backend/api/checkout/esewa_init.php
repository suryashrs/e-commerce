<?php
// backend/api/checkout/esewa_init.php
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/OrderController.php';
include_once '../../src/Services/EsewaService.php';

$database = new Database();
$db = $database->getConnection();

$orderController = new OrderController($db);
$esewaService = new EsewaService();

// Support both POST and GET for initiation (GET mostly for direct redirect from frontend if needed)
$data = json_decode(file_get_contents("php://input"));
if (!$data) {
    $data = (object)$_POST;
    if (isset($data->items) && is_string($data->items)) {
        $data->items = json_decode($data->items);
    }
}

if (empty($data->user_id) || empty($data->total_amount) || empty($data->items)) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data for checkout."]);
    exit;
}

// 1. Create a pending order
$orderResponse = $orderController->create($data);

if ($orderResponse['status'] !== 201) {
    http_response_code($orderResponse['status']);
    echo json_encode($orderResponse['body']);
    exit;
}

$order_id = $orderResponse['body']['order_id'];
// Use (string) cast to ensure consistency between signature and form value
// This converts 110.0 to "110", satisfying the strict requirement.
$amount = (string)$data->total_amount;
$transaction_uuid = $order_id . '-' . time(); 

// 2. Generate Signature
$signature = $esewaService->generateSignature($amount, $transaction_uuid);

// 3. Prepare eSewa Form Parameters
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]/e-commerce";
$successUrl = "$baseUrl/backend/api/checkout/esewa_verify.php";
$failureUrl = "$baseUrl/shop"; // Redirect back to shop on failure

$esewaParams = [
    'amount' => $amount,
    'tax_amount' => '0',
    'total_amount' => $amount,
    'transaction_uuid' => $transaction_uuid,
    'product_code' => $esewaService->getProductCode(),
    'product_service_charge' => '0',
    'product_delivery_charge' => '0',
    'success_url' => $successUrl,
    'failure_url' => $failureUrl,
    'signed_field_names' => 'total_amount,transaction_uuid,product_code',
    'signature' => $signature
];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Redirecting to eSewa...</title>
</head>
<body onload="document.forms['esewa_form'].submit()">
    <div style="text-align: center; margin-top: 50px;">
        <h2>Processing Payment...</h2>
        <p>Please do not refresh the page.</p>
    </div>
    <form id="esewa_form" action="<?php echo $esewaService->getApiUrl(); ?>" method="POST">
        <?php foreach ($esewaParams as $key => $value): ?>
            <input type="hidden" name="<?php echo $key; ?>" value="<?php echo $value; ?>">
        <?php endforeach; ?>
    </form>
</body>
</html>
