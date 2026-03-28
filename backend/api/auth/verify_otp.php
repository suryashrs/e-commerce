<?php
// backend/api/auth/verify_otp.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';
include_once '../../src/Services/OtpService.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->name) || empty($data->email) || empty($data->password) || empty($data->otp)) {
    http_response_code(400);
    echo json_encode(["message" => "All fields including OTP are required."]);
    exit;
}

$email = htmlspecialchars(strip_tags($data->email));
$otp   = htmlspecialchars(strip_tags($data->otp));

// Verify OTP
$otpError = '';
if (!OtpService::verify($db, $email, $otp, $otpError)) {
    http_response_code(400);
    echo json_encode(["message" => $otpError]);
    exit;
}

// OTP valid — create the user
$user           = new User($db);
$user->name     = $data->name;
$user->email    = $email;
$user->password = $data->password;

$valid_roles  = ['buyer', 'seller'];
$user->role   = isset($data->role) && in_array($data->role, $valid_roles) ? $data->role : 'buyer';

if (!$user->create()) {
    // Could be a race condition (duplicate email registered concurrently)
    http_response_code(503);
    echo json_encode(["message" => "Unable to create account. The email may already be in use."]);
    exit;
}

// Delete used OTP
OtpService::deleteOtp($db, $email);

http_response_code(201);
echo json_encode([
    "message" => "Account created successfully.",
    "user" => [
        "id"    => $user->id,
        "name"  => $user->name,
        "email" => $user->email,
        "role"  => $user->role
    ]
]);
?>
