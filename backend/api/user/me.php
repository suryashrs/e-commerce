<?php
// backend/api/user/me.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Get ID from query parameter (for now, until we implemented proper JWT or Session handling)
// In a real app, we would get this from the logged-in session or token
$id = isset($_GET['id']) ? $_GET['id'] : die();

$user->id = $id;

if($user->readOne()){
    $user_arr = array(
        "id" => $user->id,
        "name" => $user->name,
        "email" => $user->email,
        "role" => $user->role,
        "avatar" => $user->avatar,
        "location" => $user->location,
        "bio" => $user->bio,
        "phone" => $user->phone,
        "website" => $user->website,
        "calendar_url" => $user->calendar_url,
        "shop_status" => $user->shop_status,
        "shop_name" => $user->shop_name,
        "shop_number" => $user->shop_number,
        "shop_address" => $user->shop_address,
        "shop_phone" => $user->shop_phone
    );
    http_response_code(200);
    echo json_encode($user_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "User not found."));
}
?>
