<?php
// src/Controllers/AdminController.php

include_once __DIR__ . '/../Models/User.php';
include_once __DIR__ . '/../Models/Product.php';
include_once __DIR__ . '/../Models/Transaction.php';
include_once __DIR__ . '/../Models/ActivityLog.php';

class AdminController {
    private $db;
    private $user;
    private $product;
    private $transaction;
    private $activityLog;

    public function __construct($db){
        $this->db = $db;
        $this->user = new User($db);
        $this->product = new Product($db);
        $this->transaction = new Transaction($db);
        $this->activityLog = new ActivityLog($db);
    }

    public function getDashboardStats(){
        // Today's stats (Delivered only)
        $today = $this->transaction->getRevenueStats('today');
        
        // Yesterday's stats (Delivered only)
        $yesterday = $this->transaction->getRevenueStats('yesterday');
        
        // Last 7 days stats (Delivered only)
        $last7days = $this->transaction->getRevenueStats('7days');
        
        // Total stats (Delivered only)
        $lifetime = $this->transaction->getRevenueStats('all');
        
        // Product/User totals
        $query_counts = "SELECT 
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT COUNT(*) FROM products WHERE is_flagged = 1) as flagged_products,
            (SELECT COUNT(*) FROM users WHERE role = 'seller' AND status = 'pending') as pending_shops,
            (SELECT COUNT(*) FROM users WHERE role = 'seller' AND status = 'active') as active_sellers,
            (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as completed_orders";
        $stmt_counts = $this->db->query($query_counts);
        $counts = $stmt_counts->fetch(PDO::FETCH_ASSOC);

        return [
            "revenue" => [
                "today" => (float)($today['total_revenue'] ?? 0),
                "platform_today" => (float)($today['platform_revenue'] ?? 0),
                "yesterday" => (float)($yesterday['total_revenue'] ?? 0),
                "platform_yesterday" => (float)($yesterday['platform_revenue'] ?? 0),
                "last7days" => (float)($last7days['total_revenue'] ?? 0),
                "platform_7days" => (float)($last7days['platform_revenue'] ?? 0),
                "lifetime" => (float)($lifetime['total_revenue'] ?? 0),
                "platform_lifetime" => (float)($lifetime['platform_revenue'] ?? 0)
            ],
            "counts" => $counts,
            "recent_activity" => $this->activityLog->readAll()
        ];
    }

    public function getPendingSellers(){
        $query = "SELECT id, name, email, created_at FROM users WHERE role = 'seller' AND status = 'pending'";
        $stmt = $this->db->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function approveSeller($id, $admin_id = null){
        if($this->user->approveSeller($id)){
            $this->activityLog->log("Approved seller ID: $id", $admin_id);
            return true;
        }
        return false;
    }

    public function toggleProductFlag($id, $admin_id = null){
        $this->product->id = $id;
        if($this->product->id && $this->product->toggleFlag()){
            $this->activityLog->log("Toggled flag for product ID: $id", $admin_id);
            return true;
        }
        return false;
    }

    public function getSellerRevenueReport(){
        return $this->transaction->getSellerBreakdown();
    }
}
?>
