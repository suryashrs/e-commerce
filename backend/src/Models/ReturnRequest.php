<?php
// src/Models/ReturnRequest.php

class ReturnRequest {
    private $conn;
    private $table_name = "return_requests";

    public $id;
    public $order_id;
    public $order_item_id;
    public $user_id;
    public $seller_id;
    public $reason;
    public $image_url;
    public $status;
    public $created_at;

    public function __construct($db){
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 (order_id, order_item_id, user_id, seller_id, reason, image_url, status, created_at) 
                 VALUES (:order_id, :order_item_id, :user_id, :seller_id, :reason, :image_url, 'pending', NOW())";
        
        $stmt = $this->conn->prepare($query);

        $this->reason = htmlspecialchars(strip_tags($this->reason));
        
        $stmt->bindParam(":order_id", $this->order_id);
        $stmt->bindParam(":order_item_id", $this->order_item_id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":seller_id", $this->seller_id);
        $stmt->bindParam(":reason", $this->reason);
        $stmt->bindParam(":image_url", $this->image_url);

        if($stmt->execute()){
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function getByUserId($user_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getBySellerId($seller_id) {
        $query = "SELECT rr.*, p.name as product_name, p.image_url as product_image, 
                         u.name as buyer_name,
                         oi.price, oi.quantity
                  FROM " . $this->table_name . " rr
                  JOIN order_items oi ON rr.order_item_id = oi.id
                  JOIN products p ON oi.product_id = p.id
                  JOIN users u ON rr.user_id = u.id
                  WHERE rr.seller_id = :seller_id
                  ORDER BY rr.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":seller_id", $seller_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus($id, $status) {
        $query = "UPDATE " . $this->table_name . " SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function getById($id) {
        $query = "SELECT rr.*, oi.price, oi.quantity 
                  FROM " . $this->table_name . " rr 
                  JOIN order_items oi ON rr.order_item_id = oi.id 
                  WHERE rr.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
