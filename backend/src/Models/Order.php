<?php
// src/Models/Order.php

class Order {
    private $conn;
    private $table_name = "orders";

    public $user_id;
    public $total_amount;
    public $coupon_id;
    public $items;

    public function __construct($db){
        $this->conn = $db;
    }

    public function create(){
        try {
            $this->conn->beginTransaction();

            $query = "INSERT INTO " . $this->table_name . " (user_id, coupon_id, total_amount, status, created_at) VALUES (:user_id, :coupon_id, :total_amount, 'pending', NOW())";
            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(":user_id", $this->user_id);
            $stmt->bindParam(":coupon_id", $this->coupon_id);
            $stmt->bindParam(":total_amount", $this->total_amount);

            if($stmt->execute()){
                $order_id = $this->conn->lastInsertId();

                $query_item = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (:order_id, :product_id, :quantity, :price)";
                $stmt_item = $this->conn->prepare($query_item);

                foreach($this->items as $item){
                    $stmt_item->bindParam(":order_id", $order_id);
                    $stmt_item->bindParam(":product_id", $item->product_id);
                    $stmt_item->bindParam(":quantity", $item->quantity);
                    $stmt_item->bindParam(":price", $item->price);
                    $stmt_item->execute();
                }

                $this->conn->commit();
                return $order_id;
            }
        } catch (Exception $e) {
            error_log("Order creation failed: " . $e->getMessage());
            // For debugging, I'll temporarily echo the error to my test script
            if (isset($_SERVER['PHP_SELF']) && basename($_SERVER['PHP_SELF']) === 'test_order_creation.php') {
                echo "\nERROR DETECTED: " . $e->getMessage() . "\n";
            }
            $this->conn->rollBack();
            return false;
        }
        return false;
    }

    public function getById($id){
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStatus($id, $status){
        $query = "UPDATE " . $this->table_name . " SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        $id = htmlspecialchars(strip_tags($id));
        $status = htmlspecialchars(strip_tags($status));
        
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":status", $status);
        
        if($stmt->execute()){
            return true;
        }
        return false;
    }

    public function getOrderSellers($order_id){
        $query = "SELECT DISTINCT p.seller_id 
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = :order_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":order_id", $order_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
