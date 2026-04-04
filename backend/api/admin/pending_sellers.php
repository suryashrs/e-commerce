<?php
// backend/api/admin/pending_sellers.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$stmt = $user->getPendingSellers();
$num = $stmt->rowCount();

if ($num > 0) {
    $sellers_arr = array();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $seller_item = array(
            "id" => $id,
            "name" => $name,
            "email" => $email,
            "shop_name" => $shop_name,
            "shop_number" => $shop_number,
            "shop_address" => $shop_address,
            "shop_phone" => $shop_phone,
            "created_at" => $created_at
        );
        array_push($sellers_arr, $seller_item);
    }
    http_response_code(200);
    echo json_encode($sellers_arr);
} else {
    http_response_code(200);
    echo json_encode([]);
}
?>
