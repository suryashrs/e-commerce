<?php
// backend/src/Services/NotificationService.php

require_once __DIR__ . '/../../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../../lib/PHPMailer/SMTP.php';
require_once __DIR__ . '/../../lib/PHPMailer/Exception.php';
require_once __DIR__ . '/../../config/email.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class NotificationService {

    /**
     * General method to send emails
     */
    private static function send($toEmail, $subject, $htmlBody, $altText = '') {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USERNAME;
            $mail->Password   = SMTP_PASSWORD;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = SMTP_PORT;

            // Recipients
            $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
            $mail->addAddress($toEmail);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $altText ?: strip_tags($htmlBody);

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Mailer Error: " . $mail->ErrorInfo);
            return false;
        }
    }

    /**
     * Notification for Seller Approval
     */
    public static function sendSellerApprovalEmail($email, $name = 'Seller') {
        $subject = 'Congratulations! Your Seller Account is Approved';
        $body = self::getTemplate("
            <h2 style='color: #10b981;'>Account Approved!</h2>
            <p>Hi $name,</p>
            <p>We are excited to inform you that your seller account on <strong>WearItNow</strong> has been approved!</p>
            <p>You can now log in to your dashboard and start listing your products to reach thousands of customers.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='http://localhost:5173/seller' style='background: #18181b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;'>Go to Dashboard</a>
            </div>
            <p>Happy Selling!</p>
        ");
        return self::send($email, $subject, $body);
    }

    /**
     * Notification for Order Confirmation
     */
    public static function sendOrderConfirmationEmail($email, $orderId, $totalAmount, $items) {
        $subject = "Order Confirmation - #$orderId";
        
        $itemsHtml = '';
        foreach ($items as $item) {
            $price = number_format($item['price'], 2);
            $itemsHtml .= "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #f4f4f5;'>{$item['name']} (x{$item['quantity']})</td>
                    <td style='padding: 10px; border-bottom: 1px solid #f4f4f5; text-align: right;'>Rs. $price</td>
                </tr>
            ";
        }

        $body = self::getTemplate("
            <h2 style='color: #18181b;'>Thank you for your order!</h2>
            <p>Your order <strong>#$orderId</strong> has been placed successfully and is being processed.</p>
            <table width='100%' cellpadding='0' cellspacing='0' style='margin: 20px 0; border: 1px solid #e4e4e7; border-radius: 8px;'>
                <thead>
                    <tr style='background: #fafafa;'>
                        <th style='padding: 10px; text-align: left; border-bottom: 2px solid #e4e4e7;'>Item</th>
                        <th style='padding: 10px; text-align: right; border-bottom: 2px solid #e4e4e7;'>Price</th>
                    </tr>
                </thead>
                <tbody>
                    $itemsHtml
                </tbody>
                <tfoot>
                    <tr style='font-weight: 700; background: #fafafa;'>
                        <td style='padding: 10px;'>Total</td>
                        <td style='padding: 10px; text-align: right;'>Rs. " . number_format($totalAmount, 2) . "</td>
                    </tr>
                </tfoot>
            </table>
            <p>We will notify you once your order has been shipped.</p>
        ");
        return self::send($email, $subject, $body);
    }

    /**
     * Notification for Order Status Update
     */
    public static function sendOrderStatusUpdateEmail($email, $orderId, $status, $trackingNumber = '', $trackingLink = '') {
        $subject = "Update on Order #$orderId";
        
        $statusColor = '#18181b';
        $statusMessage = "Your order status has been updated to: <strong>$status</strong>.";
        $trackingInfo = "";

        if ($trackingNumber) {
            $trackingInfo = "
                <div style='background: #fafafa; border: 1px dashed #e4e4e7; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                    <p style='margin: 0; font-size: 14px;'><strong>Tracking Number:</strong> $trackingNumber</p>
                    " . ($trackingLink ? "<a href='$trackingLink' style='color: #3b82f6; font-size: 13px;'>Track Shipment</a>" : "") . "
                </div>
            ";
        }
        
        if ($status === 'Shipped') {
            $statusColor = '#3b82f6';
            $statusMessage = "Great news! Your order <strong>#$orderId</strong> has been shipped and is on its way to you.";
        } elseif ($status === 'Delivered') {
            $statusColor = '#10b981';
            $statusMessage = "Your order <strong>#$orderId</strong> has been delivered. We hope you love your purchase!";
        } elseif ($status === 'Cancelled') {
            $statusColor = '#ef4444';
            $statusMessage = "Your order <strong>#$orderId</strong> has been cancelled.";
        }

        $body = self::getTemplate("
            <h2 style='color: $statusColor;'>Order $status</h2>
            <p>$statusMessage</p>
            $trackingInfo
            <p>You can track your order details in your account.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='http://localhost:5173/orders' style='background: #18181b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;'>View Order Details</a>
            </div>
        ");
        return self::send($email, $subject, $body);
    }

    /**
     * Notification for Payment Receipt
     */
    public static function sendPaymentReceiptEmail($email, $orderId, $amount, $transactionId) {
        $subject = "Payment Receipt for Order #$orderId";
        $body = self::getTemplate("
            <h2 style='color: #10b981;'>Payment Successful</h2>
            <p>We've received your payment for order <strong>#$orderId</strong>.</p>
            <div style='background: #fafafa; border: 1px solid #e4e4e7; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                <p style='margin: 5px 0;'><strong>Order ID:</strong> #$orderId</p>
                <p style='margin: 5px 0;'><strong>Amount Paid:</strong> Rs. " . number_format($amount, 2) . "</p>
                <p style='margin: 5px 0;'><strong>Transaction ID:</strong> $transactionId</p>
                <p style='margin: 5px 0;'><strong>Payment Method:</strong> eSewa</p>
            </div>
            <p>Thank you for shopping with us!</p>
        ");
        return self::send($email, $subject, $body);
    }

    /**
     * Welcome Email
     */
    public static function sendWelcomeEmail($email, $name) {
        $subject = "Welcome to WearItNow!";
        $body = self::getTemplate("
            <h2 style='color: #18181b;'>Welcome to the Family!</h2>
            <p>Hi $name,</p>
            <p>Thanks for joining <strong>WearItNow</strong>. We're thrilled to have you with us!</p>
            <p>Explore our latest collections and find the perfect style for you.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='http://localhost:5173' style='background: #18181b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;'>Start Shopping</a>
            </div>
        ");
        return self::send($email, $subject, $body);
    }

    /**
     * Notification for Seller about a New Order
     */
    public static function sendNewOrderSellerEmail($email, $orderId, $amount) {
        $subject = "New Order Received - #$orderId";
        $body = self::getTemplate("
            <h2 style='color: #18181b;'>New Order!</h2>
            <p>You have received a new order <strong>#$orderId</strong>.</p>
            <p>Order Amount: <strong>Rs. " . number_format($amount, 2) . "</strong></p>
            <p>Please log in to your dashboard to process the order.</p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='http://localhost:5173/seller' style='background: #18181b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;'>View Dashboard</a>
            </div>
        ");
        return self::send($email, $subject, $body);
    }

    /**
     * Base Template for Emails
     */
    private static function getTemplate($content) {
        $year = date('Y');
        return "
        <!DOCTYPE html>
        <html>
        <head><meta charset='UTF-8'></head>
        <body style='margin:0;padding:0;background:#f4f4f5;font-family:\"Segoe UI\",Arial,sans-serif;'>
          <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f5;padding:40px 0;'>
            <tr><td align='center'>
              <table width='520' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>
                <tr>
                  <td style='background:#18181b;padding:32px 40px;text-align:center;'>
                    <h1 style='margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;'>WearItNow</h1>
                  </td>
                </tr>
                <tr>
                  <td style='padding:40px; font-size: 15px; line-height: 1.6; color: #3f3f46;'>
                    $content
                  </td>
                </tr>
                <tr>
                  <td style='background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #f4f4f5;'>
                    <p style='font-size:12px;color:#a1a1aa;margin:0;'>© $year WearItNow. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>";
    }
}
