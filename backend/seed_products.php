<?php
// backend/seed_products.php
include_once './config/database.php';

$database = new Database();
$db = $database->getConnection();

$products = [
  [
    "name" => "Classic White Tee",
    "category" => "Tops",
    "price" => "29.99",
    "image_url" => "http://localhost/e-commerce/backend/uploads/white_tee_product_1763717500608.png",
    "description" => "A timeless classic. This soft, breathable white tee is a wardrobe essential. Made from 100% organic cotton for maximum comfort."
  ],
  [
    "name" => "Denim Jacket",
    "category" => "Outerwear",
    "price" => "89.99",
    "image_url" => "http://localhost/e-commerce/backend/uploads/denim_jacket_product_1763717518029.png",
    "description" => "Vintage-inspired denim jacket with a modern fit. Perfect for layering in any season. Features durable stitching and premium hardware."
  ],
  [
    "name" => "Summer Floral Dress",
    "category" => "Dresses",
    "price" => "59.99",
    "image_url" => "http://localhost/e-commerce/backend/uploads/floral_dress_product_1763717558747.png",
    "description" => "Light and airy floral dress perfect for summer days. Features a flattering silhouette and adjustable straps."
  ],
  [
    "name" => "Black Jeans",
    "category" => "Bottoms",
    "price" => "69.99",
    "image_url" => "http://localhost/e-commerce/backend/uploads/black_jeans_product_1763717535141.png",
    "description" => "Modern slim fit black jeans with just the right amount of stretch. Versatile enough for casual or semi-formal occasions."
  ],
  [
    "name" => "Leather Jacket",
    "category" => "Outerwear",
    "price" => "149.99",
    "image_url" => "http://localhost/e-commerce/backend/uploads/leather_jacket_product_1763717580099.png",
    "description" => "Premium leather jacket with a sleek design. Perfect for adding edge to any outfit."
  ],
  [
    "name" => "Chinos",
    "category" => "Bottoms",
    "price" => "59.99",
    "image_url" => "http://localhost/e-commerce/backend/uploads/chinos_product_1763717604890.png",
    "description" => "Comfortable chinos perfect for smart-casual occasions. Features a tailored fit and durable fabric."
  ],
  [
    "name" => "Polo Shirt",
    "category" => "Tops",
    "price" => "49.99",
    "image_url" => "http://localhost/e-commerce/backend/uploads/polo_shirt_product_1763717619986.png",
    "description" => "Classic polo shirt suitable for both casual and semi-formal settings. Made from premium pique cotton."
  ]
];

$query = "INSERT INTO products (name, category, price, image_url, description) VALUES (:name, :category, :price, :image_url, :description)";
$stmt = $db->prepare($query);

foreach ($products as $product) {
    // Check if exists logic optional, but for now just insert
    $stmt->bindParam(":name", $product['name']);
    $stmt->bindParam(":category", $product['category']);
    $stmt->bindParam(":price", $product['price']);
    $stmt->bindParam(":image_url", $product['image_url']);
    $stmt->bindParam(":description", $product['description']);

    if($stmt->execute()){
        echo "Inserted: " . $product['name'] . "<br>";
    } else {
        echo "Failed to insert: " . $product['name'] . "<br>";
    }
}
?>
