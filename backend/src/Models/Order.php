<?php
// src/Models/Order.php

class Order {
    private $conn;
    private $table_name = "orders";

    public $user_id;
    public $total_amount;
    public $items;

    public function __construct($db){
        $this->conn = $db;
    }

    public function create(){
        try {
            $this->conn->beginTransaction();

            $query = "INSERT INTO " . $this->table_name . " (user_id, total_amount, status, created_at) VALUES (:user_id, :total_amount, 'pending', NOW())";
            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(":user_id", $this->user_id);
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
            $this->conn->rollBack();
            return false;
        }
        return false;
    }
}
?>
