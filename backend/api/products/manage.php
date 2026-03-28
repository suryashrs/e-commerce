<?php
// backend/api/products/manage.php -- Single endpoint for create/update/delete based on method
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Controllers/ProductController.php';

$database = new Database();
$db = $database->getConnection();

$controller = new ProductController($db);
$method = $_SERVER['REQUEST_METHOD'];
// Only decode JSON if content type is json, otherwise use $_POST
$input = file_get_contents("php://input");
$data = !empty($input) ? json_decode($input) : null;

$response = array("status" => 405, "body" => array("message" => "Method not allowed"));

switch($method){
    case 'POST':
        file_put_contents('../../debug_post.txt', print_r($_POST, true)); // DEBUG
        // Check for _method override (common for multipart PUT)
        if(isset($_POST['_method']) && $_POST['_method'] === 'PUT'){
             $response = $controller->update($_POST, $_FILES);
        } else if (isset($_POST['_method']) && $_POST['_method'] === 'DELETE'){ // unlikely for multipart but safe to handle
             $response = $controller->delete($_POST); // Delete doesn't usually use multipart
        } else {
             $response = $controller->create($_POST, $_FILES);
        }
        break;
    case 'DELETE':
         // Fallback for standard JSON delete
         $response = $controller->delete($data);
         break;
    default:
        // Handle raw PUT if strictly JSON (legacy support)
        if ($method === 'PUT') {
             $response = $controller->update($data); 
        }
        break;
}

http_response_code($response['status']);
echo json_encode($response['body']);
?>
