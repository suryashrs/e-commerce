<?php
// src/Models/User.php

class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $name;
    public $email;
    public $password;
    public $role;
    public $status; // Add this

    public $avatar;
    public $location;
    public $bio;
    public $phone;
    public $website;
    public $calendar_url;
    
    // Shop specific fields
    public $shop_status;
    public $shop_name;
    public $shop_number;
    public $shop_address;
    public $shop_phone;

    public function __construct($db){
        $this->conn = $db;
    }

    // Create new user (Signup)
    public function create(){
        $query = "INSERT INTO " . $this->table_name . " SET name=:name, email=:email, password_hash=:password_hash, plain_password=:plain_password, role=:role, shop_name=:shop_name, shop_number=:shop_number, shop_address=:shop_address, shop_phone=:shop_phone, shop_status=:shop_status";
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->password = htmlspecialchars(strip_tags($this->password));
        $this->role = htmlspecialchars(strip_tags($this->role));

        // Hash password
        $password_hash = password_hash($this->password, PASSWORD_BCRYPT);

        // Bind
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $password_hash);
        $stmt->bindParam(":plain_password", $this->password);
        $stmt->bindParam(":role", $this->role);
        
        // Bind Shop details
        $this->shop_name = htmlspecialchars(strip_tags($this->shop_name));
        $this->shop_number = htmlspecialchars(strip_tags($this->shop_number));
        $this->shop_address = htmlspecialchars(strip_tags($this->shop_address));
        $this->shop_phone = htmlspecialchars(strip_tags($this->shop_phone));
        $this->shop_status = !empty($this->shop_status) ? $this->shop_status : ($this->role === 'seller' ? 'pending' : 'none');

        $stmt->bindParam(":shop_name", $this->shop_name);
        $stmt->bindParam(":shop_number", $this->shop_number);
        $stmt->bindParam(":shop_address", $this->shop_address);
        $stmt->bindParam(":shop_phone", $this->shop_phone);
        $stmt->bindParam(":shop_status", $this->shop_status);

        if($stmt->execute()){
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Check if email exists
    public function emailExists(){
        $query = "SELECT id, name, password_hash, role, avatar, location, bio, phone, website, calendar_url, shop_status, shop_name, shop_number, shop_address, shop_phone FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        if($stmt->rowCount() > 0){
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->password = $row['password_hash'];
            $this->role = $row['role'];
            $this->avatar = $row['avatar'];
            $this->location = $row['location'];
            $this->bio = $row['bio'];
            $this->phone = $row['phone'];
            $this->website = $row['website'];
            $this->calendar_url = $row['calendar_url'];
            $this->shop_status = $row['shop_status'];
            $this->shop_name = $row['shop_name'];
            $this->shop_number = $row['shop_number'];
            $this->shop_address = $row['shop_address'];
            $this->shop_phone = $row['shop_phone'];
            return true;
        }
        return false;
    }

    // Get Single User details
    public function readOne(){
         $query = "SELECT id, name, email, role, avatar, location, bio, phone, website, calendar_url, shop_status, shop_name, shop_number, shop_address, shop_phone FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
         $stmt = $this->conn->prepare($query);
         $stmt->bindParam(1, $this->id);
         $stmt->execute();

         if($stmt->rowCount() > 0){
             $row = $stmt->fetch(PDO::FETCH_ASSOC);
             $this->name = $row['name'];
             $this->email = $row['email'];
             $this->role = $row['role'];
             $this->avatar = $row['avatar'];
             $this->location = $row['location'];
             $this->bio = $row['bio'];
             $this->phone = $row['phone'];
             $this->website = $row['website'];
             $this->calendar_url = $row['calendar_url'];
             $this->shop_status = $row['shop_status'];
             $this->shop_name = $row['shop_name'];
             $this->shop_number = $row['shop_number'];
             $this->shop_address = $row['shop_address'];
             $this->shop_phone = $row['shop_phone'];
             return true;
         }
         return false;
    }

    // Update User Profile
    public function update(){
        $query = "UPDATE " . $this->table_name . "
                SET
                    name = :name,
                    avatar = :avatar,
                    location = :location,
                    bio = :bio,
                    phone = :phone,
                    website = :website,
                    calendar_url = :calendar_url
                WHERE
                    id = :id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->avatar = htmlspecialchars(strip_tags($this->avatar));
        $this->location = htmlspecialchars(strip_tags($this->location));
        $this->bio = htmlspecialchars(strip_tags($this->bio));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->website = htmlspecialchars(strip_tags($this->website));
        $this->calendar_url = htmlspecialchars(strip_tags($this->calendar_url));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Bind
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':avatar', $this->avatar);
        $stmt->bindParam(':location', $this->location);
        $stmt->bindParam(':bio', $this->bio);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':website', $this->website);
        $stmt->bindParam(':calendar_url', $this->calendar_url);
        $stmt->bindParam(':id', $this->id);

        if($stmt->execute()){
            return true;
        }
        return false;
    }
    // Get Password Hash by ID (for verification)
    public function getPasswordHashById(){
        $query = "SELECT password_hash FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();

        if($stmt->rowCount() > 0){
             $row = $stmt->fetch(PDO::FETCH_ASSOC);
             $this->password = $row['password_hash'];
             return true;
        }
        return false;
    }

    // Update Password
    public function updatePassword($plain_password = null){
        $query = "UPDATE " . $this->table_name . " SET password_hash = :password_hash, plain_password = :plain_password WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Sanitize & Bind Hash
        $this->password = htmlspecialchars(strip_tags($this->password));
        $stmt->bindParam(':password_hash', $this->password);

        // Sanitize & Bind Plain Text
        $plain_password_val = "";
        if($plain_password){
             $plain_password_val = htmlspecialchars(strip_tags($plain_password));
        }
        $stmt->bindParam(':plain_password', $plain_password_val);

        // Bind ID
        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':id', $this->id);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    // Approve Seller
    public function updateShopStatus($id, $status){
        $query = "UPDATE " . $this->table_name . " SET shop_status = :status WHERE id = :id AND role = 'seller'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    // List Pending Sellers
    public function getPendingSellers(){
        $query = "SELECT id, name, email, shop_name, shop_number, shop_address, shop_phone, created_at 
                  FROM " . $this->table_name . " 
                  WHERE role = 'seller' AND shop_status = 'pending' 
                  ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>
