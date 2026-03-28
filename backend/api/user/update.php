<?php
// backend/api/user/update.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)){
    $user->id = $data->id;
    $user->name = $data->name;
    $user->avatar = isset($data->avatar) ? $data->avatar : null;
    $user->location = isset($data->location) ? $data->location : null;
    $user->bio = isset($data->bio) ? $data->bio : null;
    $user->phone = isset($data->phone) ? $data->phone : null;
    $user->website = isset($data->website) ? $data->website : null;
    $user->calendar_url = isset($data->calendar_url) ? $data->calendar_url : null;
    
    if($user->update()){
        http_response_code(200);
        echo json_encode(array("message" => "User was updated.", "user" => $data));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to update user."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update user. Data is incomplete."));
}
?>
