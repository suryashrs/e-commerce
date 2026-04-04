<?php
// src/Models/ActivityLog.php

class ActivityLog {
    private $conn;
    private $table_name = "activity_logs";

    public $id;
    public $action;
    public $user_id;
    public $created_at;

    public function __construct($db){
        $this->conn = $db;
    }

    public function log($action, $user_id = null){
        $query = "INSERT INTO " . $this->table_name . " SET action=:action, user_id=:user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':user_id', $user_id);
        return $stmt->execute();
    }

    public function readAll(){
        $query = "SELECT l.*, u.name as user_name 
                  FROM " . $this->table_name . " l 
                  LEFT JOIN users u ON l.user_id = u.id 
                  ORDER BY l.created_at DESC LIMIT 50";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
