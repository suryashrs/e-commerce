<?php
// src/Models/Notification.php

class Notification {
    private $conn;
    private $table_name = "notifications";

    public $id;
    public $user_id;
    public $related_id;
    public $type;
    public $message;
    public $is_read;
    public $created_at;

    public function __construct($db){
        $this->conn = $db;
    }

    public function create(){
        $query = "INSERT INTO " . $this->table_name . " 
                (user_id, related_id, type, message, is_read, created_at) 
                VALUES (:user_id, :related_id, :type, :message, :is_read, NOW())";
        
        $stmt = $this->conn->prepare($query);

        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->related_id = htmlspecialchars(strip_tags($this->related_id));
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->message = htmlspecialchars(strip_tags($this->message));
        $this->is_read = $this->is_read ? 1 : 0;

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":related_id", $this->related_id);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":message", $this->message);
        $stmt->bindParam(":is_read", $this->is_read);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    public function readByUser($user_id){
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 50";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        return $stmt;
    }
}
?>
