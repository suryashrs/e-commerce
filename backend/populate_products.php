<?php
// backend/populate_products.php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

$products = [
  [
    "name" => "Classic White Tee",
    "category" => "Tops",
    "price" => 29.99,
    "image_url" => "/uploads/white_tee_product_1763717500608.png",
    "description" => "A timeless classic. This soft, breathable white tee is a wardrobe essential. Made from 100% organic cotton for maximum comfort.",
    "sizes" => json_encode(["S", "M", "L", "XL"]),
    "colors" => json_encode(["White"])
  ],
  [
    "name" => "Denim Jacket",
    "category" => "Outerwear",
    "price" => 89.99,
    "image_url" => "/uploads/denim_jacket_product_1763717518029.png",
    "description" => "Vintage-inspired denim jacket with a modern fit. Perfect for layering in any season. Features durable stitching and premium hardware.",
    "sizes" => json_encode(["S", "M", "L"]),
    "colors" => json_encode(["Blue"])
  ],
  [
    "name" => "Summer Floral Dress",
    "category" => "Dresses",
    "price" => 59.99,
    "image_url" => "/uploads/floral_dress_product_1763717558747.png",
    "description" => "Light and airy floral dress perfect for summer days. Features a flattering silhouette and adjustable straps.",
    "sizes" => json_encode(["S", "M", "L"]),
    "colors" => json_encode(["Floral"])
  ],
  [
    "name" => "Black Jeans",
    "category" => "Bottoms",
    "price" => 69.99,
    "image_url" => "/uploads/black_jeans_product_1763717535141.png",
    "description" => "Modern slim fit black jeans with just the right amount of stretch. Versatile enough for casual or semi-formal occasions.",
    "sizes" => json_encode(["28", "30", "32", "34"]),
    "colors" => json_encode(["Black"])
  ],
  [
    "name" => "Leather Jacket",
    "category" => "Outerwear",
    "price" => 149.99,
    "image_url" => "/uploads/leather_jacket_product_1763717580099.png",
    "description" => "Premium leather jacket with a sleek design. Perfect for adding edge to any outfit.",
    "sizes" => json_encode(["S", "M", "L"]),
    "colors" => json_encode(["Black"])
  ],
  [
    "name" => "Chinos",
    "category" => "Bottoms",
    "price" => 59.99,
    "image_url" => "/uploads/chinos_product_1763717604890.png",
    "description" => "Comfortable chinos perfect for smart-casual occasions. Features a tailored fit and durable fabric.",
    "sizes" => json_encode(["30", "32", "34"]),
    "colors" => json_encode(["Beige", "Navy"])
  ],
  [
    "name" => "Polo Shirt",
    "category" => "Tops",
    "price" => 49.99,
    "image_url" => "/uploads/polo_shirt_product_1763717619986.png",
    "description" => "Classic polo shirt suitable for both casual and semi-formal settings. Made from premium pique cotton.",
    "sizes" => json_encode(["M", "L", "XL"]),
    "colors" => json_encode(["Blue", "White"])
  ]
];

foreach ($products as $product) {
    // Check if exists
    $check = "SELECT id FROM products WHERE name = :name";
    $stmt = $db->prepare($check);
    $stmt->bindParam(':name', $product['name']);
    $stmt->execute();
    
    if($stmt->rowCount() == 0) {
        $query = "INSERT INTO products SET 
            name=:name, 
            description=:description, 
            price=:price, 
            category=:category, 
            image_url=:image_url, 
            sizes=:sizes, 
            colors=:colors";
            
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":name", $product['name']);
        $stmt->bindParam(":description", $product['description']);
        $stmt->bindParam(":price", $product['price']);
        $stmt->bindParam(":category", $product['category']);
        $stmt->bindParam(":image_url", $product['image_url']);
        $stmt->bindParam(":sizes", $product['sizes']);
        $stmt->bindParam(":colors", $product['colors']);
        
        if($stmt->execute()){
            echo "Inserted: " . $product['name'] . "\n";
        } else {
            echo "Failed to insert: " . $product['name'] . "\n";
        }
    } else {
        echo "Skipped (already exists): " . $product['name'] . "\n";
    }
}
?>
