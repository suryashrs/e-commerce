<?php
// backend/api/admin/update_shop_status.php
include_once '../../config/cors.php';
include_once '../../src/Config/Database.php';
include_once '../../src/Models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->status)) {
    if ($user->updateShopStatus($data->id, $data->status)) {
        
        // If approved, notify the seller
        if ($data->status === 'approved') {
            include_once '../../src/Models/Notification.php';
            $notification = new Notification($db);
            $notification->user_id = $data->id;
            $notification->type = 'SYSTEM_UPDATE';
            $notification->message = "Congratulations! Your seller account has been approved. You can now start listing products.";
            $notification->create();

            // Fetch user details to get email
            $user->id = $data->id;
            if ($user->readOne()) {
                include_once '../../src/Services/EmailService.php';
                $subject = "Shop Application Approved - WearItNow";
                
                // Construct a nice HTML email body
                $body = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;'>
                    <div style='background-color: #4f46e5; padding: 20px; text-align: center;'>
                        <h1 style='color: white; margin: 0;'>WearItNow</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <h2 style='color: #333;'>Congratulations, " . htmlspecialchars($user->name) . "!</h2>
                        <p style='color: #555; line-height: 1.6;'>
                            Your shop application for <strong>" . htmlspecialchars($user->shop_name ?? 'your store') . "</strong> has been officially approved by our administration team.
                        </p>
                        <p style='color: #555; line-height: 1.6;'>
                            You can now log in to your account, switch to <strong>Seller Mode</strong>, and start listing your products to millions of shoppers.
                        </p>
                        <div style='text-align: center; margin-top: 30px;'>
                            <a href='http://localhost:5173/login' style='background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Go to Seller Dashboard</a>
                        </div>
                    </div>
                    <div style='background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;'>
                        &copy; " . date('Y') . " WearItNow. All rights reserved.
                    </div>
                </div>";
                
                $errorMsg = '';
                EmailService::sendEmail($user->email, $subject, $body, '', $errorMsg);
            }
        }

        http_response_code(200);
        echo json_encode(["message" => "Shop status updated successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["message" => "Unable to update shop status."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. User ID and status are required."]);
}
?>
