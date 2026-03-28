<?php
// backend/api/auth/login.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/AuthController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new AuthController($db);
$data = json_decode(file_get_contents("php://input"));

$response = $controller->login($data);

http_response_code($response['status']);
echo json_encode($response['body']);
?>
