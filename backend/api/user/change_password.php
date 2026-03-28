<?php
// backend/api/user/change_password.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->id) &&
    !empty($data->current_password) &&
    !empty($data->new_password)
){
    $user->id = $data->id;
    $current_password_input = $data->current_password;
    $new_password_input = $data->new_password;

    // 1. Fetch current password hash
    if($user->getPasswordHashById()){
        // $user->password now contains the hash
        
        // 2. Verify current password
        if(password_verify($current_password_input, $user->password)){
            
            // 3. Update with new password
            $user->password = password_hash($new_password_input, PASSWORD_BCRYPT);
            
            if($user->updatePassword($new_password_input)){
                http_response_code(200);
                echo json_encode(array("message" => "Password updated successfully."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to update password."));
            }
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Incorrect current password."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "User not found."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
