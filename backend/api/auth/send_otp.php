<?php
// backend/api/auth/send_otp.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';
include_once '../../src/Services/OtpService.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->name) || empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Name, email, and password are required."]);
    exit;
}

$email = htmlspecialchars(strip_tags($data->email));

// Check if email already registered
$user = new User($db);
$user->email = $email;
if ($user->emailExists()) {
    http_response_code(409);
    echo json_encode(["message" => "An account with this email already exists."]);
    exit;
}

// Generate OTP and store in DB
$otp = OtpService::generateAndStore($db, $email);

// Send OTP via email
$errorMsg = '';
if (!OtpService::sendEmail($email, $otp, $errorMsg)) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to send OTP email. Please try again. Details: " . $errorMsg]);
    exit;
}

http_response_code(200);
echo json_encode(["message" => "OTP sent successfully. Please check your email."]);
?>
