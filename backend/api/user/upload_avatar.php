<?php
// backend/api/user/upload_avatar.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Check if file and user ID are present
if(isset($_FILES['avatar']) && isset($_POST['id'])) {
    
    $user->id = $_POST['id'];
    $file = $_FILES['avatar'];
    
    // Validate file
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $max_size = 2 * 1024 * 1024; // 2MB
    
    if (!in_array($file['type'], $allowed_types)) {
        http_response_code(400);
        echo json_encode(array("message" => "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed."));
        exit();
    }
    
    if ($file['size'] > $max_size) {
        http_response_code(400);
        echo json_encode(array("message" => "File size too large. Max 2MB."));
        exit();
    }
    
    // Create unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $user->id . '_' . time() . '.' . $extension;
    $upload_dir = '../../uploads/avatars/';
    $target_file = $upload_dir . $filename;
    
    // Ensure directory exists (redundant if manually created, but good practice)
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    if (move_uploaded_file($file['tmp_name'], $target_file)) {
        // Construct public URL
        // Assuming the backend is at http://localhost/e-commerce/backend/
        // Adjust this base URL as per your environment configuration or send relative path
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        // Simple way to get base URL essentially
        $host = $_SERVER['HTTP_HOST'];
        $base_path = '/e-commerce/backend/uploads/avatars/';
        $avatar_url = $protocol . "://" . $host . $base_path . $filename;
        
        // Update database
        $user->avatar = $avatar_url;
        
        // Update database directly to avoid overwriting other fields
        $query = "UPDATE users SET avatar = :avatar WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':avatar', $avatar_url);
        $stmt->bindParam(':id', $user->id);

        if($stmt->execute()){
            http_response_code(200);
            echo json_encode(array(
                "message" => "Avatar uploaded successfully.",
                "avatar_url" => $avatar_url
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "File uploaded but database update failed."));
        }
        
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to move uploaded file."));
    }
    
} else {
    http_response_code(400);
    echo json_encode(array("message" => "No file or user ID provided."));
}
?>
