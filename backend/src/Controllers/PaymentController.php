<?php
// src/Controllers/PaymentController.php

include_once __DIR__ . '/../Models/Order.php';
include_once __DIR__ . '/../Models/User.php';

class PaymentController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getPaymentHistory($userId, $role) {
        if ($role === 'seller') {
            return $this->getSellerPayments($userId);
        } else {
            return $this->getBuyerPayments($userId);
        }
    }

    private function getBuyerPayments($userId) {
        $query = "SELECT id, total_amount, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId]);
        
        $payments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $payments[] = [
                "id" => $row['id'],
                "amount" => $row['total_amount'],
                "status" => $row['status'],
                "date" => $row['created_at'],
                "type" => "Purchase",
                "method" => "eSewa/Cash"
            ];
        }
        
        return ["status" => 200, "body" => $payments];
    }

    private function getSellerPayments($userId) {
        // Fetch transactions for this seller
        $query = "SELECT t.id, t.amount, t.platform_commission, t.created_at, o.id as order_id 
                  FROM transactions t
                  JOIN orders o ON t.order_id = o.id
                  WHERE t.seller_id = ? 
                  ORDER BY t.created_at DESC";
                  
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId]);
        
        $payments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $payments[] = [
                "id" => $row['id'],
                "order_id" => $row['order_id'],
                "amount" => $row['amount'],
                "commission" => $row['platform_commission'],
                "net_amount" => $row['amount'] - $row['platform_commission'],
                "date" => $row['created_at'],
                "type" => "Earnings",
                "status" => "Settled"
            ];
        }
        
        return ["status" => 200, "body" => $payments];
    }
}
?>
