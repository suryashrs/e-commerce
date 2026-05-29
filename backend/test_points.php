<?php
include_once 'c:/xampp/htdocs/e-commerce/backend/src/Config/Database.php';
include_once 'c:/xampp/htdocs/e-commerce/backend/src/Controllers/OrderController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new OrderController($db);

$data = json_decode('{
  "user_id": 1,
  "total_amount": 250,
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "price": 250
    }
  ]
}');

echo "User points before:\n";
$stmt = $db->query("SELECT points, lifetime_points FROM users WHERE id = 1");
print_r($stmt->fetch(PDO::FETCH_ASSOC));

$response = $controller->create($data);
echo "Order creation response:\n";
print_r($response);

echo "User points after:\n";
$stmt = $db->query("SELECT points, lifetime_points FROM users WHERE id = 1");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
?>
