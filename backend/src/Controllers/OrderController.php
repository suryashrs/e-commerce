<?php
// src/Controllers/OrderController.php

include_once __DIR__ . '/../Models/Order.php';

class OrderController {
    private $db;
    private $order;

    public function __construct($db){
        $this->db = $db;
        $this->order = new Order($db);
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

            $order_id = $this->order->create();

            if($order_id){
                return array("status" => 201, "body" => array("message" => "Order created successfully.", "order_id" => $order_id));
            } else {
                return array("status" => 503, "body" => array("message" => "Unable to create order."));
            }
        } else {
            return array("status" => 400, "body" => array("message" => "Unable to create order. Data is incomplete."));
        }
    }
}
?>
