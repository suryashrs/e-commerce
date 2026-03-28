<?php
// backend/api/products/delete.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/Product.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE' && isset($_GET['id']) && isset($_GET['seller_id'])) {
    $database = new Database();
    $db = $database->getConnection();

    $product = new Product($db);
    $product->id = (int)$_GET['id'];
    
    // First, verify the seller owns this product
    $query = "SELECT seller_id FROM products WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $product->id);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['message' => 'Product not found']);
        exit;
    }

    if ((int)$row['seller_id'] !== (int)$_GET['seller_id']) {
        http_response_code(403);
        echo json_encode(['message' => 'Unauthorized to delete this product']);
        exit;
    }

    // Attempt deletion
    if ($product->delete()) {
        http_response_code(200);
        echo json_encode(['message' => 'Product deleted successfully.']);
    } else {
        http_response_code(503);
        echo json_encode(['message' => 'Unable to delete product.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed or missing parameters.']);
}
?>
