<?php
// backend/api/auth/reset_password.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';
include_once '../../src/Services/OtpService.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->otp) || empty($data->new_password)) {
    http_response_code(400);
    echo json_encode(["message" => "Email, OTP, and new password fields are strictly required."]);
    exit;
}

$email = htmlspecialchars(strip_tags($data->email));
$otp = htmlspecialchars(strip_tags($data->otp));
$new_password = htmlspecialchars(strip_tags($data->new_password));

// Verify OTP
$errorMsg = '';
if (!OtpService::verify($db, $email, $otp, $errorMsg)) {
    http_response_code(400);
    echo json_encode(["message" => $errorMsg]);
    exit;
}

// Instantiate User model and search for the user context
$user = new User($db);
$user->email = $email;

if (!$user->emailExists()) {
    http_response_code(404);
    echo json_encode(["message" => "User context couldn't be evaluated. Please verify email and try again."]);
    exit;
}

// Set hashed password and submit changes
$user->password = password_hash($new_password, PASSWORD_BCRYPT);
if ($user->updatePassword($new_password)) {
    // Delete OTP logically mapping to one-time usage validation
    OtpService::deleteOtp($db, $email);
    
    http_response_code(200);
    echo json_encode(["message" => "Your password has been successfully reset. You can now login."]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "System error. Service temporarily unavailable to update password."]);
}
?>
