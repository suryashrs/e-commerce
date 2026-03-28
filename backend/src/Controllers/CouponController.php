<?php
// src/Controllers/CouponController.php

include_once __DIR__ . '/../Models/Coupon.php';

class CouponController {
    private $db;
    private $coupon;

    public function __construct($db){
        $this->db = $db;
        $this->coupon = new Coupon($db);
    }

    public function index(){
        if(isset($_GET['seller_id'])){
            $this->coupon->seller_id = $_GET['seller_id'];
            $stmt = $this->coupon->read();
        } else {
            $stmt = $this->coupon->getValidCoupons();
        }

        $num = $stmt->rowCount();

        if($num > 0){
            $coupons_arr = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
                extract($row);
                $coupon_item = array(
                    "id" => $id,
                    "seller_id" => $seller_id,
                    "code" => $code,
                    "discount_type" => $discount_type,
                    "discount_value" => $discount_value,
                    "expiry_date" => $expiry_date,
                    "usage_count" => $usage_count
                );
                array_push($coupons_arr, $coupon_item);
            }
            return array("status" => 200, "body" => $coupons_arr);
        } else {
            return array("status" => 200, "body" => []); 
        }
    }

    public function create($data){
        $data = (array) $data;
        
        if(!empty($data['seller_id']) && !empty($data['code']) && !empty($data['discount_type']) && !empty($data['discount_value']) && !empty($data['expiry_date'])){
            $this->coupon->seller_id = $data['seller_id'];
            $this->coupon->code = $data['code'];
            $this->coupon->discount_type = $data['discount_type'];
            $this->coupon->discount_value = $data['discount_value'];
            $this->coupon->expiry_date = $data['expiry_date'];
            
            if($this->coupon->create()){
                return array("status" => 201, "body" => array("message" => "Coupon created successfully."));
            }
            return array("status" => 503, "body" => array("message" => "Unable to create coupon."));
        }
        return array("status" => 400, "body" => array("message" => "Incomplete data."));
    }

    public function validate($code){
        if(empty($code)){
            return array("status" => 400, "body" => array("message" => "Coupon code is required."));
        }

        $stmt = $this->coupon->validate($code);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if($row){
            return array("status" => 200, "body" => array(
                "id" => $row['id'],
                "code" => $row['code'],
                "discount_type" => $row['discount_type'],
                "discount_value" => $row['discount_value'],
                "seller_id" => $row['seller_id']
            ));
        } else {
            return array("status" => 404, "body" => array("message" => "Invalid or expired coupon code."));
        }
    }

    public function delete($id){
        if(empty($id)){
            return array("status" => 400, "body" => array("message" => "Coupon ID is required."));
        }
        $this->coupon->id = $id;
        if($this->coupon->delete()){
            return array("status" => 200, "body" => array("message" => "Coupon deleted."));
        }
        return array("status" => 503, "body" => array("message" => "Unable to delete coupon."));
    }

    public function update($data){
        if(empty($data['id']) || empty($data['code']) || empty($data['discount_type']) || empty($data['discount_value']) || empty($data['expiry_date'])){
            return array("status" => 400, "body" => array("message" => "Incomplete data."));
        }
        $this->coupon->id = $data['id'];
        $this->coupon->code = $data['code'];
        $this->coupon->discount_type = $data['discount_type'];
        $this->coupon->discount_value = $data['discount_value'];
        $this->coupon->expiry_date = $data['expiry_date'];
        if($this->coupon->update()){
            return array("status" => 200, "body" => array("message" => "Coupon updated."));
        }
        return array("status" => 503, "body" => array("message" => "Unable to update coupon."));
    }
}
?>
