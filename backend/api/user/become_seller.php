<?php
// backend/api/user/become_seller.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id)) {
    try {
        $query = "UPDATE users 
                  SET role = 'seller', 
                      shop_status = 'pending',
                      shop_name = :shop_name,
                      shop_number = :shop_number,
                      shop_address = :shop_address,
                      shop_phone = :shop_phone
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->user_id);
        $stmt->bindParam(':shop_name', $data->shop_name);
        $stmt->bindParam(':shop_number', $data->shop_number);
        $stmt->bindParam(':shop_address', $data->shop_address);
        $stmt->bindParam(':shop_phone', $data->shop_phone);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Request submitted. Waiting for Admin approval.", "role" => "seller", "shop_status" => "pending"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Unable to submit request."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. User ID is required."]);
}
?>
