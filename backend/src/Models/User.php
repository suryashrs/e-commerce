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

    public $avatar;
    public $location;
    public $bio;
    public $phone;
    public $website;
    public $calendar_url;

    public function __construct($db){
        $this->conn = $db;
    }

    // Create new user (Signup)
    public function create(){
        $query = "INSERT INTO " . $this->table_name . " SET name=:name, email=:email, password_hash=:password_hash, plain_password=:plain_password, role=:role";
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

        if($stmt->execute()){
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Check if email exists
    public function emailExists(){
        $query = "SELECT id, name, password_hash, role, avatar, location, bio, phone, website, calendar_url FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
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
            return true;
        }
        return false;
    }

    // Get Single User details
    public function readOne(){
         $query = "SELECT id, name, email, role, avatar, location, bio, phone, website, calendar_url FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
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
}
?>
