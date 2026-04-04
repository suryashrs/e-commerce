<?php
// backend/api/admin/seller_revenue.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';
include_once '../../src/Models/Product.php';
include_once '../../src/Models/Transaction.php';
include_once '../../src/Models/ActivityLog.php';
include_once '../../src/Controllers/AdminController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new AdminController($db);
$report = $controller->getSellerRevenueReport();

http_response_code(200);
echo json_encode(["status" => 200, "body" => $report]);
?>
