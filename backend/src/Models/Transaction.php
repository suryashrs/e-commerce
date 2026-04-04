<?php
// src/Models/Transaction.php

class Transaction {
     private $conn;
     private $table_name = "transactions";

     public $id;
     public $seller_id;
     public $order_id;
     public $amount;
     public $platform_commission;
     public $created_at;

     public function __construct($db){
         $this->conn = $db;
     }

     public function create(){
         $query = "INSERT INTO " . $this->table_name . " SET seller_id=:seller_id, order_id=:order_id, amount=:amount, platform_commission=:platform_commission";
         $stmt = $this->conn->prepare($query);

         // We use Rs. 100 as a static platform commission
         if(!$this->platform_commission){
            $this->platform_commission = 100.00; 
         }

         $stmt->bindParam(":seller_id", $this->seller_id);
         $stmt->bindParam(":order_id", $this->order_id);
         $stmt->bindParam(":amount", $this->amount);
         $stmt->bindParam(":platform_commission", $this->platform_commission);

         return $stmt->execute();
     }

     public function getRevenueStats($timeframe = 'today'){
         $date_filter = "";
         if($timeframe === 'today'){
             $date_filter = "AND DATE(t.created_at) = CURDATE()";
         } elseif($timeframe === 'yesterday'){
             $date_filter = "AND DATE(t.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
         } elseif($timeframe === '7days'){
             $date_filter = "AND t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
         }

         // We join with orders to ensure we only count 'delivered' ones!
         $query = "SELECT SUM(t.amount) as total_revenue, SUM(t.platform_commission) as platform_revenue 
                   FROM " . $this->table_name . " t
                   JOIN orders o ON t.order_id = o.id
                   WHERE o.status = 'delivered' $date_filter";
         
         $stmt = $this->conn->prepare($query);
         $stmt->execute();
         return $stmt->fetch(PDO::FETCH_ASSOC);
     }

     public function getSellerBreakdown(){
         $query = "SELECT u.name as seller_name, SUM(t.amount) as revenue, COUNT(t.id) as order_count 
                   FROM " . $this->table_name . " t
                   JOIN users u ON t.seller_id = u.id
                   JOIN orders o ON t.order_id = o.id
                   WHERE o.status = 'delivered'
                   GROUP BY t.seller_id";
         
         $stmt = $this->conn->prepare($query);
         $stmt->execute();
         return $stmt->fetchAll(PDO::FETCH_ASSOC);
     }
}
?>
