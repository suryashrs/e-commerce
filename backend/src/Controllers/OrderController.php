<?php
// src/Controllers/OrderController.php

include_once __DIR__ . '/../Models/Order.php';
include_once __DIR__ . '/../Models/Notification.php';
include_once __DIR__ . '/../Models/Coupon.php';
include_once __DIR__ . '/../Models/Transaction.php';

class OrderController {
    private $db;
    private $order;
    private $notification;
    private $coupon;
    private $transaction;

    public function __construct($db){
        $this->db = $db;
        $this->order = new Order($db);
        $this->notification = new Notification($db);
        $this->coupon = new Coupon($db);
        $this->transaction = new Transaction($db);
    }

    public function create($data){
        if(empty($data->user_id)){
            return array("status" => 401, "body" => array("message" => "Unauthorized. Please log in."));
        }

        if(
            !empty($data->total_amount) &&
            !empty($data->items) &&
            is_array($data->items)
        ){
            $this->order->user_id = $data->user_id;
            $this->order->total_amount = $data->total_amount;
            $this->order->items = $data->items;
            $this->order->coupon_id = null;

            // Process Coupon if provided
            if(!empty($data->coupon_code)){
                $coupon_stmt = $this->coupon->validate($data->coupon_code);
                $coupon_data = $coupon_stmt->fetch(PDO::FETCH_ASSOC);
                if($coupon_data){
                    $this->order->coupon_id = $coupon_data['id'];
                    // We increment usage AFTER successful creation below
                }
            }

            $order_id = $this->order->create();

            if($order_id){
                if($this->order->coupon_id){
                    $this->coupon->incrementUsage($this->order->coupon_id);
                }

                // Create transactions for each seller in the order
                $seller_totals = [];
                foreach($data->items as $item) {
                    // We need the seller_id for each item. We can fetch it or trust the frontend (better fetch)
                    $seller_query = "SELECT seller_id FROM products WHERE id = ?";
                    $s_stmt = $this->db->prepare($seller_query);
                    $s_stmt->execute([$item->product_id]);
                    $seller_row = $s_stmt->fetch(PDO::FETCH_ASSOC);
                    if($seller_row) {
                        $sid = $seller_row['seller_id'];
                        if(!isset($seller_totals[$sid])) $seller_totals[$sid] = 0;
                        $seller_totals[$sid] += ($item->price * $item->quantity);
                    }
                }

                foreach($seller_totals as $sid => $total) {
                    $this->transaction->seller_id = $sid;
                    $this->transaction->order_id = $order_id;
                    $this->transaction->amount = $total;
                    $this->transaction->platform_commission = 100.00; // Static amount
                    $this->transaction->create();

                    // Optional: Notification for seller
                    $this->notification->user_id = $sid;
                    $this->notification->related_id = $order_id;
                    $this->notification->type = 'NEW_ORDER';
                    $this->notification->message = "New order (#{$order_id}) received for Rs. " . number_format($total, 2);
                    $this->notification->create();
                }

                return array("status" => 201, "body" => array("message" => "Order created successfully.", "order_id" => $order_id));
            } else {
                return array("status" => 503, "body" => array("message" => "Unable to create order. See server logs for details."));
            }
        } else {
            return array("status" => 400, "body" => array("message" => "Unable to create order. Data is incomplete."));
        }
    }

    /**
     * Scenario A: Seller updates order status to 'Shipped'
     */
    public function updateStatus($order_id, $status) {
        if ($this->order->updateStatus($order_id, $status)) {
            // Trigger notification for all status changes!
            $orderData = $this->order->getById($order_id);
            if ($orderData) {
                $this->notification->user_id = $orderData['user_id'];
                $this->notification->related_id = $order_id;
                $this->notification->type = 'ORDER_UPDATE';
                if ($status === 'Shipped') {
                    $this->notification->message = "Good news! Your order #{$order_id} has been shipped and is on its way.";
                } elseif ($status === 'Delivered') {
                    $this->notification->message = "Yay! Your order #{$order_id} has been marked as Delivered.";
                } elseif ($status === 'Cancelled') {
                    $this->notification->message = "Alert: Your order #{$order_id} has been Cancelled.";
                } else {
                    $this->notification->message = "Your order #{$order_id} status changed to {$status}.";
                }
                $this->notification->create();

                // If cancelled, notify the sellers as well
                if ($status === 'Cancelled') {
                    $sellers = $this->order->getOrderSellers($order_id);
                    foreach ($sellers as $seller) {
                        $this->notification->user_id = $seller['seller_id'];
                        $this->notification->related_id = $order_id;
                        $this->notification->type = 'ORDER_UPDATE';
                        $this->notification->message = "Order #{$order_id} has been Cancelled by the buyer.";
                        $this->notification->create();
                    }
                }
            }
            return array("status" => 200, "body" => array("message" => "Order status updated to {$status}."));
        }
        return array("status" => 503, "body" => array("message" => "Unable to update order status."));
    }

    /**
     * Scenario B: Buyer confirms receipt (status moves to 'Delivered')
     */
    public function confirmReceipt($order_id) {
        $status = 'Delivered';
        if ($this->order->updateStatus($order_id, $status)) {
            // Notify all sellers involved in the order
            $sellers = $this->order->getOrderSellers($order_id);
            foreach ($sellers as $seller) {
                $this->notification->user_id = $seller['seller_id'];
                $this->notification->related_id = $order_id;
                $this->notification->type = 'ORDER_UPDATE';
                $this->notification->message = "Order #{$order_id} has been marked as Delivered by the buyer.";
                $this->notification->create();
            }
            return array("status" => 200, "body" => array("message" => "Order #{$order_id} marked as Delivered. Sellers notified."));
        }
        return array("status" => 503, "body" => array("message" => "Unable to confirm receipt."));
    }
}
?>
