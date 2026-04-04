<?php
// backend/api/products/read.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/ProductController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new ProductController($db);
$response = $controller->index();
http_response_code(200);
echo json_encode($response['body'] ?? []);
?>
