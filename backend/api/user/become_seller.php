<?php
// backend/api/user/become_seller.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id)) {
    try {
        $email = isset($data->email) ? htmlspecialchars(strip_tags($data->email)) : '';
        
        if (!empty($email)) {
            // Check if the email is the same as the current email
            $getCurrentQuery = "SELECT email FROM users WHERE id = :id";
            $getCurrentStmt = $db->prepare($getCurrentQuery);
            $getCurrentStmt->bindParam(':id', $data->user_id);
            $getCurrentStmt->execute();
            $currentUser = $getCurrentStmt->fetch(PDO::FETCH_ASSOC);
            if ($currentUser && strtolower($currentUser['email']) === strtolower($email)) {
                http_response_code(400);
                echo json_encode(["message" => "Email address is same. Please enter a different email to be a seller."]);
                exit;
            }

            // Check if email already exists for another user
            $checkQuery = "SELECT id FROM users WHERE email = :email AND id != :id";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':email', $email);
            $checkStmt->bindParam(':id', $data->user_id);
            $checkStmt->execute();
            if ($checkStmt->rowCount() > 0) {
                http_response_code(409);
                echo json_encode(["message" => "This email address is already linked to another account."]);
                exit;
            }
        }

        $query = "UPDATE users 
                  SET role = 'seller', 
                      shop_status = 'pending',
                      shop_name = :shop_name,
                      shop_number = :shop_number,
                      shop_address = :shop_address,
                      shop_phone = :shop_phone" . (!empty($email) ? ", email = :email" : "") . "
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->user_id);
        $stmt->bindParam(':shop_name', $data->shop_name);
        $stmt->bindParam(':shop_number', $data->shop_number);
        $stmt->bindParam(':shop_address', $data->shop_address);
        $stmt->bindParam(':shop_phone', $data->shop_phone);
        if (!empty($email)) {
            $stmt->bindParam(':email', $email);
        }

        if ($stmt->execute()) {
            http_response_code(200);
            $response = [
                "message" => "Request submitted. Waiting for Admin approval.", 
                "role" => "seller", 
                "shop_status" => "pending"
            ];
            if (!empty($email)) {
                $response["email"] = $email;
            }
            echo json_encode($response);
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
