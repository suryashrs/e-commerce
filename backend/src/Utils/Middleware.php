<?php
// src/Utils/Middleware.php

class Middleware {
    public static function checkRole($requiredRole) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['role'])) {
            http_response_code(401);
            echo json_encode(["message" => "Unauthorized. Please login."]);
            exit;
        }

        if ($_SESSION['role'] !== $requiredRole && $_SESSION['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden. You do not have the required role."]);
            exit;
        }
    }

    public static function preventSelfPurchase($sellerId, $productId, $db) {
        $query = "SELECT seller_id FROM products WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $productId);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($product && $product['seller_id'] == $sellerId) {
            http_response_code(403);
            echo json_encode(["message" => "Sellers cannot purchase their own products."]);
            exit;
        }
    }
}
?>
