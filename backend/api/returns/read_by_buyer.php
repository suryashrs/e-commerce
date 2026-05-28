<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

$stmt = $returnRequest->getByUserId($user_id);

http_response_code(200);
if (count($stmt) > 0) {
    echo json_encode(["status" => 200, "body" => $stmt]);
} else {
    echo json_encode(["status" => 200, "body" => []]);
}
?>
