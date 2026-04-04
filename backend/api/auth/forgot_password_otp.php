<?php
// backend/api/auth/forgot_password_otp.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';
include_once '../../src/Services/OtpService.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email)) {
    http_response_code(400);
    echo json_encode(["message" => "Email is required."]);
    exit;
}

$email = htmlspecialchars(strip_tags($data->email));

// Check if user with email exists
$user = new User($db);
$user->email = $email;
if (!$user->emailExists()) {
    http_response_code(404);
    echo json_encode(["message" => "Opps! No account found with that email address."]);
    exit;
}

// Generate OTP and store locally
$otp = OtpService::generateAndStore($db, $email);

// Dispatch Email
$errorMsg = '';
if (!OtpService::sendEmail($email, $otp, $errorMsg)) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to send reset code. Please try again later."]);
    exit;
}

http_response_code(200);
echo json_encode(["message" => "Reset code dispatched successfully. Please check your email inbox."]);
?>
