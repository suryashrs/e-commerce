<?php
// src/Models/Coupon.php

class Coupon {
    private $conn;
    private $table_name = "coupons";

    public $id;
    public $seller_id;
    public $code;
    public $discount_type;
    public $discount_value;
    public $expiry_date;
    public $usage_count;
    public $created_at;

    public function __construct($db){
        $this->conn = $db;
    }

    public function read(){
        $query = "SELECT * FROM " . $this->table_name;
        if($this->seller_id){
             $query .= " WHERE seller_id = :seller_id";
        }
        $query .= " ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        
        if($this->seller_id){
             $stmt->bindParam(":seller_id", $this->seller_id);
        }

        $stmt->execute();
        return $stmt;
    }

    public function create(){
        $query = "INSERT INTO " . $this->table_name . " SET seller_id=:seller_id, code=:code, discount_type=:discount_type, discount_value=:discount_value, expiry_date=:expiry_date";
        $stmt = $this->conn->prepare($query);

        $this->seller_id = htmlspecialchars(strip_tags($this->seller_id));
        $this->code = strtoupper(htmlspecialchars(strip_tags($this->code))); 
        $this->discount_type = htmlspecialchars(strip_tags($this->discount_type));
        $this->discount_value = htmlspecialchars(strip_tags($this->discount_value));
        $this->expiry_date = htmlspecialchars(strip_tags($this->expiry_date));

        $stmt->bindParam(":seller_id", $this->seller_id);
        $stmt->bindParam(":code", $this->code);
        $stmt->bindParam(":discount_type", $this->discount_type);
        $stmt->bindParam(":discount_value", $this->discount_value);
        $stmt->bindParam(":expiry_date", $this->expiry_date);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    public function getValidCoupons(){
        // Get all active and not expired coupons
        $query = "SELECT * FROM " . $this->table_name . " WHERE expiry_date >= CURDATE() ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function validate($code){
        $query = "SELECT * FROM " . $this->table_name . " WHERE code = :code AND expiry_date >= CURDATE() LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $code = strtoupper(htmlspecialchars(strip_tags($code)));
        $stmt->bindParam(":code", $code);
        $stmt->execute();
        return $stmt;
    }

    public function delete(){
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(1, $this->id);
        return $stmt->execute();
    }

    public function update(){
        $query = "UPDATE " . $this->table_name . " SET code=:code, discount_type=:discount_type, discount_value=:discount_value, expiry_date=:expiry_date WHERE id=:id";
        $stmt = $this->conn->prepare($query);
        $this->code = strtoupper(htmlspecialchars(strip_tags($this->code)));
        $this->discount_type = htmlspecialchars(strip_tags($this->discount_type));
        $this->discount_value = htmlspecialchars(strip_tags($this->discount_value));
        $this->expiry_date = htmlspecialchars(strip_tags($this->expiry_date));
        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(":code", $this->code);
        $stmt->bindParam(":discount_type", $this->discount_type);
        $stmt->bindParam(":discount_value", $this->discount_value);
        $stmt->bindParam(":expiry_date", $this->expiry_date);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }
}
?>
