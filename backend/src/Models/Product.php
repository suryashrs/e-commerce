<?php
// src/Models/Product.php

class Product {
    private $conn;
    private $table_name = "products";

    public $id;
    public $name;
    public $description;
    public $price;
    public $image_url;
    public $try_on_image_url;
    public $category;
    public $sizes;
    public $colors;
    public $seller_id;
    public $is_try_on_only;
    public $has_tryon;
    public $stock;
    public $is_flagged;

    public function __construct($db){
        $this->conn = $db;
    }

    public function read($include_flagged = false){
        $query = "SELECT p.*, u.name as seller_name FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.seller_id = u.id";
        
        $conditions = [];
        if($this->seller_id){
             $conditions[] = "p.seller_id = :seller_id";
        }
        if(!$include_flagged){
             $conditions[] = "p.is_flagged = 0";
        }

        if(count($conditions) > 0){
             $query .= " WHERE " . implode(" AND ", $conditions);
        }
        $query .= " ORDER BY p.created_at DESC";

        $stmt = $this->conn->prepare($query);
        
        if($this->seller_id){
             $stmt->bindParam(":seller_id", $this->seller_id);
        }

        $stmt->execute();
        return $stmt;
    }

    public function readOne(){
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        return $stmt;
    }

    public function create($files = []){
        // Handle File Upload
        if(isset($files['image']) && $files['image']['error'] === 0){
            $target_dir = "../../uploads/";
            $file_name = uniqid() . '_' . basename($files['image']['name']);
            $target_file = $target_dir . $file_name;
            
            if(move_uploaded_file($files['image']['tmp_name'], $target_file)){
                $this->image_url = "http://localhost/e-commerce/backend/uploads/" . $file_name;
            }
        }

        $query = "INSERT INTO " . $this->table_name . " 
                SET name=:name, price=:price, description=:description, 
                    category=:category, seller_id=:seller_id, image_url=:image_url,
                    try_on_image_url=:try_on_image_url, is_try_on_only=:is_try_on_only, 
                    has_tryon=:has_tryon, stock=:stock, sizes=:sizes, colors=:colors, is_flagged=0";

        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->price = htmlspecialchars(strip_tags($this->price));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->image_url = htmlspecialchars(strip_tags($this->image_url));
        $this->try_on_image_url = htmlspecialchars(strip_tags($this->try_on_image_url));
        $this->seller_id = htmlspecialchars(strip_tags($this->seller_id));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":try_on_image_url", $this->try_on_image_url);
        $stmt->bindParam(":is_try_on_only", $this->is_try_on_only);
        $stmt->bindParam(":has_tryon", $this->has_tryon);
        $stmt->bindParam(":stock", $this->stock);
        $stmt->bindParam(":sizes", $this->sizes);
        $stmt->bindParam(":colors", $this->colors);
        $stmt->bindParam(":seller_id", $this->seller_id);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    public function update(){
        $query = "UPDATE " . $this->table_name . " SET name=:name, description=:description, price=:price, category=:category, image_url=:image_url, try_on_image_url=:try_on_image_url, is_try_on_only=:is_try_on_only, has_tryon=:has_tryon, stock=:stock, sizes=:sizes, colors=:colors WHERE id=:id";
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->price = htmlspecialchars(strip_tags($this->price));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->image_url = htmlspecialchars(strip_tags($this->image_url));
        $this->try_on_image_url = htmlspecialchars(strip_tags($this->try_on_image_url));
        $this->id = htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":image_url", $this->image_url);
        $stmt->bindParam(":try_on_image_url", $this->try_on_image_url);
        $stmt->bindParam(":is_try_on_only", $this->is_try_on_only);
        $stmt->bindParam(":has_tryon", $this->has_tryon);
        $stmt->bindParam(":stock", $this->stock);
        $stmt->bindParam(":sizes", $this->sizes);
        $stmt->bindParam(":colors", $this->colors);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()){
            return true;
        }
        return false;
    }

    public function delete(){
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        if($stmt->execute()){
            return true;
        }
        return false;
    }

    public function toggleFlag(){
        $query = "UPDATE " . $this->table_name . " SET is_flagged = CASE WHEN is_flagged = 1 THEN 0 ELSE 1 END WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }
}
?>
