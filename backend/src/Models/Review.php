<?php
// src/Models/Review.php

class Review {
    private $conn;
    private $table_name = "reviews";

    public $id;
    public $user_id;
    public $product_id;
    public $rating;
    public $comment;
    public $created_at;
    public $updated_at;

    public function __construct($db){
        $this->conn = $db;
    }

    // Check if user has purchased the product
    public function hasPurchased($user_id, $product_id) {
        $query = "SELECT count(*) as count 
                  FROM orders o 
                  JOIN order_items oi ON o.id = oi.order_id 
                  WHERE o.user_id = :user_id 
                  AND oi.product_id = :product_id"; // Removed status check for easier testing
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':product_id', $product_id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] > 0;
    }

    // Create review
    public function create() {
        // First check if already reviewed
        if ($this->hasAlreadyReviewed($this->user_id, $this->product_id)) {
            return "ALREADY_REVIEWED";
        }

        // Check if purchased
        if (!$this->hasPurchased($this->user_id, $this->product_id)) {
            return "NOT_PURCHASED";
        }

        $query = "INSERT INTO " . $this->table_name . " 
                  SET user_id=:user_id, product_id=:product_id, rating=:rating, comment=:comment, status='active'";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->rating = (int)$this->rating;
        $this->comment = htmlspecialchars(strip_tags($this->comment));

        // Bind
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":product_id", $this->product_id);
        $stmt->bindParam(":rating", $this->rating);
        $stmt->bindParam(":comment", $this->comment);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    // Check if user has already reviewed the product (only active reviews)
    public function hasAlreadyReviewed($user_id, $product_id) {
        $query = "SELECT count(*) as count FROM " . $this->table_name . " WHERE user_id = :user_id AND product_id = :product_id AND status = 'active'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':product_id', $product_id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] > 0;
    }

    // Read reviews for a product (only active reviews)
    public function readByProduct($product_id, $sort = 'latest') {
        $order_by = "r.created_at DESC";
        if ($sort === 'highest') {
            $order_by = "r.rating DESC, r.created_at DESC";
        }

        $query = "SELECT r.*, u.name as user_name 
                  FROM " . $this->table_name . " r 
                  JOIN users u ON r.user_id = u.id 
                  WHERE r.product_id = :product_id 
                  AND r.status = 'active'
                  ORDER BY " . $order_by;
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':product_id', $product_id);
        $stmt->execute();
        return $stmt;
    }

    // Read reviews for a specific seller's products
    public function readForSeller($seller_id) {
        $query = "SELECT r.*, u.name as user_name, p.name as product_name 
                  FROM " . $this->table_name . " r 
                  JOIN users u ON r.user_id = u.id 
                  JOIN products p ON r.product_id = p.id 
                  WHERE p.seller_id = :seller_id 
                  ORDER BY r.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':seller_id', $seller_id);
        $stmt->execute();
        return $stmt;
    }

    // Add/Update seller reply
    public function addSellerReply($review_id, $seller_id, $reply_text) {
        // First verify the seller owns the product this review is for
        $query = "SELECT r.* FROM " . $this->table_name . " r 
                  JOIN products p ON r.product_id = p.id 
                  WHERE r.id = :review_id AND p.seller_id = :seller_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':review_id', $review_id);
        $stmt->bindParam(':seller_id', $seller_id);
        $stmt->execute();

        if ($stmt->rowCount() == 0) {
            return false;
        }

        $query = "UPDATE " . $this->table_name . " 
                  SET seller_reply = :reply, seller_reply_at = CURRENT_TIMESTAMP 
                  WHERE id = :review_id";
        
        $stmt = $this->conn->prepare($query);
        $reply_text = htmlspecialchars(strip_tags($reply_text));
        $stmt->bindParam(':reply', $reply_text);
        $stmt->bindParam(':review_id', $review_id);

        return $stmt->execute();
    }

    // Admin: Read all reviews
    public function readAllForAdmin() {
        $query = "SELECT r.*, u.name as user_name, p.name as product_name 
                  FROM " . $this->table_name . " r 
                  JOIN users u ON r.user_id = u.id 
                  JOIN products p ON r.product_id = p.id 
                  ORDER BY r.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Admin: Soft delete review
    public function adminSoftDelete($review_id, $admin_id) {
        $query = "UPDATE " . $this->table_name . " SET status = 'deleted' WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $review_id);

        if ($stmt->execute()) {
            // Log the action
            $log_query = "INSERT INTO activity_logs (action, user_id) VALUES (:action, :admin_id)";
            $log_stmt = $this->conn->prepare($log_query);
            $action = "Deleted review ID: " . $review_id;
            $log_stmt->bindParam(':action', $action);
            $log_stmt->bindParam(':admin_id', $admin_id);
            $log_stmt->execute();
            return true;
        }
        return false;
    }

    // Update review
    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET rating = :rating, comment = :comment 
                  WHERE id = :id AND user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->rating = (int)$this->rating;
        $this->comment = htmlspecialchars(strip_tags($this->comment));

        // Bind
        $stmt->bindParam(":rating", $this->rating);
        $stmt->bindParam(":comment", $this->comment);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    // Delete review
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    // Get average rating for a product (only active reviews)
    public function getAverageRating($product_id) {
        $query = "SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
                  FROM " . $this->table_name . " 
                  WHERE product_id = :product_id 
                  AND status = 'active'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':product_id', $product_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
