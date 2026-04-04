<?php
// src/Controllers/ProductController.php

include_once __DIR__ . '/../Models/Product.php';

class ProductController {
    private $db;
    private $product;

    public function __construct($db){
        $this->db = $db;
        $this->product = new Product($db);
    }

    public function index(){
        $include_flagged = isset($_GET['admin']) && $_GET['admin'] === 'true';

        // Check for seller_id filter (GET parameter)
        if(isset($_GET['seller_id'])){
            $this->product->seller_id = $_GET['seller_id'];
        }

        $stmt = $this->product->read($include_flagged);
        $num = $stmt->rowCount();

        if($num > 0){
            $products_arr = array();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
                extract($row);
                $product_item = array(
                    "id" => $id,
                    "name" => $name,
                    "description" => html_entity_decode($description),
                    "price" => $price,
                    "category" => $category,
                    "image_url" => $image_url,
                    "try_on_image_url" => $try_on_image_url,
                    "is_try_on_only" => (int)$is_try_on_only,
                    "has_tryon" => (int)$has_tryon,
                    "stock" => (int)$stock,
                    "sizes" => json_decode($sizes),
                    "colors" => json_decode($colors),
                    "is_flagged" => (bool)($row['is_flagged'] == 1),
                    "seller_name" => $seller_name ?? 'Anonymous'
                );
                array_push($products_arr, $product_item);
            }
            return array("status" => 200, "body" => $products_arr);
        } else {
            return array("status" => 200, "body" => []); 
        }
    }

    public function show($id){
        $this->product->id = $id;
        $stmt = $this->product->readOne();
        $num = $stmt->rowCount();

        if($num > 0){
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            extract($row);

            $is_admin = isset($_GET['admin']) && $_GET['admin'] === 'true';
            if ($is_flagged && !$is_admin) {
                return array("status" => 404, "body" => array("message" => "Product is currently unavailable."));
            }

            $product_item = array(
                "id" => $id,
                "name" => $name,
                "description" => html_entity_decode($description),
                "price" => $price,
                "category" => $category,
                "image_url" => $image_url,
                "try_on_image_url" => $try_on_image_url,
                "is_try_on_only" => (int)$is_try_on_only,
                "has_tryon" => (int)$has_tryon,
                "stock" => (int)$stock,
                "sizes" => json_decode($sizes),
                "colors" => json_decode($colors),
                "is_flagged" => (bool)($row['is_flagged'] == 1)
            );
            return array("status" => 200, "body" => $product_item);
        } else {
            return array("status" => 404, "body" => array("message" => "Product not found."));
        }
    }

    public function create($data, $files = null){
        // Cast object to array if needed or handle both
        $data = (array) $data;
        
        if(!empty($data['name']) && !empty($data['price'])){
            $this->product->name = $data['name'];
            $this->product->price = $data['price'];
            $this->product->description = $data['description'] ?? '';
            $this->product->category = $data['category'] ?? '';
            $this->product->seller_id = $data['seller_id'] ?? 0;
            $this->product->has_tryon = $data['has_tryon'] ?? 0;
            
            // Handle File Upload
            if(isset($files['image']) && $files['image']['error'] === 0){
                $target_dir = "../../uploads/";
                if (!file_exists($target_dir)) {
                    mkdir($target_dir, 0777, true);
                }
                $file_name = time() . "_" . basename($files['image']['name']);
                $target_file = $target_dir . $file_name;
                
                if(move_uploaded_file($files['image']['tmp_name'], $target_file)){
                    // URL path
                    $this->product->image_url = "http://localhost/e-commerce/backend/uploads/" . $file_name;
                    
                    // Automate Background Removal if toggled ON
                    if ($this->product->has_tryon == 1) {
                        $transparent_file_name = "transparent_" . $file_name;
                        $transparent_target_file = $target_dir . $transparent_file_name;
                        
                        // Call Python script
                        $python_path = "python"; // Adjust if needed
                        $script_path = __DIR__ . "/../../process_bg.py";
                        $command = escapeshellcmd("$python_path \"$script_path\" \"$target_file\" \"$transparent_target_file\"");
                        exec($command, $output, $return_var);
                        
                        if ($return_var === 0) {
                            $this->product->try_on_image_url = "http://localhost/e-commerce/backend/uploads/" . $transparent_file_name;
                        }
                    }
                }
            } else {
                if (isset($data['image_url'])) { $this->product->image_url = $data['image_url']; }
                if (isset($data['try_on_image_url'])) { $this->product->try_on_image_url = $data['try_on_image_url']; }
            }

            $this->product->is_try_on_only = $data['is_try_on_only'] ?? 0;
            $this->product->has_tryon = $data['has_tryon'] ?? 0;
            $this->product->stock = $data['stock'] ?? 0;

            $this->product->sizes = json_encode($data['sizes'] ?? []);
            $this->product->colors = json_encode($data['colors'] ?? []);

            if($this->product->create()){
                return array("status" => 201, "body" => array("message" => "Product created."));
            }
            return array("status" => 503, "body" => array("message" => "Unable to create product."));
        }
        return array("status" => 400, "body" => array("message" => "Incomplete data."));
    }

    public function update($data, $files = null){
        $data = (array) $data;
        if(!empty($data['id'])){
            $this->product->id = $data['id'];
            $this->product->name = $data['name'];
            $this->product->price = $data['price'];
            $this->product->description = $data['description'];
            $this->product->category = $data['category'];
            $this->product->has_tryon = $data['has_tryon'] ?? 0;
            
             // Handle File Upload
             if(isset($files['image']) && $files['image']['error'] === 0){
                $target_dir = "../../uploads/";
                $file_name = time() . "_" . basename($files['image']['name']);
                $target_file = $target_dir . $file_name;
                
                if(move_uploaded_file($files['image']['tmp_name'], $target_file)){
                    $this->product->image_url = "http://localhost/e-commerce/backend/uploads/" . $file_name;
                    
                    // Automate Background Removal if toggled ON
                    if ($this->product->has_tryon == 1) {
                        $transparent_file_name = "transparent_" . $file_name;
                        $transparent_target_file = $target_dir . $transparent_file_name;
                        
                        $python_path = "python";
                        $script_path = __DIR__ . "/../../process_bg.py";
                        $command = escapeshellcmd("$python_path \"$script_path\" \"$target_file\" \"$transparent_target_file\"");
                        exec($command, $output, $return_var);
                        
                        if ($return_var === 0) {
                            $this->product->try_on_image_url = "http://localhost/e-commerce/backend/uploads/" . $transparent_file_name;
                        }
                    }
                }
            } else {
                if (isset($data['image_url'])) { $this->product->image_url = $data['image_url']; }
                if (isset($data['try_on_image_url'])) { $this->product->try_on_image_url = $data['try_on_image_url']; }
                
                // Trigger background removal if toggled ON but no transparent image exists yet
                if ($this->product->has_tryon == 1 && (empty($this->product->try_on_image_url) || $this->product->try_on_image_url == "")) {
                    if (!empty($this->product->image_url)) {
                        $file_name = basename($this->product->image_url);
                        $target_file = "../../uploads/" . $file_name;
                        
                        if (file_exists($target_file)) {
                            $transparent_file_name = "transparent_" . $file_name;
                            $transparent_target_file = "../../uploads/" . $transparent_file_name;
                            
                            $python_path = "python";
                            $script_path = __DIR__ . "/../../process_bg.py";
                            $command = escapeshellcmd("$python_path \"$script_path\" \"$target_file\" \"$transparent_target_file\"");
                            exec($command, $output, $return_var);
                            
                            if ($return_var === 0) {
                                $this->product->try_on_image_url = "http://localhost/e-commerce/backend/uploads/" . $transparent_file_name;
                            }
                        }
                    }
                }
            }

            $this->product->is_try_on_only = $data['is_try_on_only'] ?? 0;
            $this->product->has_tryon = $data['has_tryon'] ?? 0;
            $this->product->stock = $data['stock'] ?? 0;

            $this->product->sizes = json_encode($data['sizes'] ?? []);
            $this->product->colors = json_encode($data['colors'] ?? []);

            if($this->product->update()){
                return array("status" => 200, "body" => array("message" => "Product updated."));
            }
            return array("status" => 503, "body" => array("message" => "Unable to update product."));
        }
        return array("status" => 400, "body" => array("message" => "Incomplete data."));
    }

    public function delete($data){
        if(!empty($data->id)){
            $this->product->id = $data->id;
            if($this->product->delete()){
                return array("status" => 200, "body" => array("message" => "Product deleted."));
            }
            return array("status" => 503, "body" => array("message" => "Unable to delete product."));
        }
        return array("status" => 400, "body" => array("message" => "Product ID is missing."));
    }
}
?>
