<?php
// backend/api/products/single.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/ProductController.php';

$database = new Database();
$db = $database->getConnection();

$id = isset($_GET['id']) ? $_GET['id'] : die();

$controller = new ProductController($db);
$response = $controller->show($id);

    http_response_code(200);
    echo json_encode($response['body'] ?? []);
?>
