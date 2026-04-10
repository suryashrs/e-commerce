<?php
// src/Config/Database.php

class Database {
    private $host = "localhost";
    private $db_name = "wearitnow_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $options = [
                PDO::ATTR_TIMEOUT => 3 // 3 seconds timeout
            ];
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password, $options);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            // Error handled by returning null instead of echoing, allowing callers to send JSON errors
            return null;
        }

        return $this->conn;
    }
}
?>
