<?php
// backend/src/Services/OtpService.php

require_once __DIR__ . '/../../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../../lib/PHPMailer/SMTP.php';
require_once __DIR__ . '/../../lib/PHPMailer/Exception.php';
require_once __DIR__ . '/../../config/email.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class OtpService {

    /**
     * Generate a 6-digit OTP, delete any existing OTPs for the email,
     * store the new one in DB (with 10-min expiry), and return it.
     */
    public static function generateAndStore($db, $email) {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        // Remove old OTPs for this email
        $del = $db->prepare("DELETE FROM otp_verifications WHERE email = ?");
        $del->execute([$email]);

        // Insert new OTP
        $ins = $db->prepare("INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)");
        $ins->execute([$email, $otp, $expires_at]);

        return $otp;
    }

    /**
     * Verify the submitted OTP against the database.
     * Returns true if valid and not expired, false otherwise.
     * Also returns an error reason via the $error output parameter.
     */
    public static function verify($db, $email, $otp, &$error = '') {
        $query = $db->prepare("SELECT otp_code, expires_at FROM otp_verifications WHERE email = ? ORDER BY created_at DESC LIMIT 1");
        $query->execute([$email]);

        if ($query->rowCount() === 0) {
            $error = 'No OTP found for this email. Please request a new OTP.';
            return false;
        }

        $row = $query->fetch(PDO::FETCH_ASSOC);

        if (strtotime($row['expires_at']) < time()) {
            $error = 'OTP has expired. Please request a new one.';
            return false;
        }

        if ($row['otp_code'] !== $otp) {
            $error = 'Incorrect OTP. Please try again.';
            return false;
        }

        return true;
    }

    /**
     * Delete all OTPs for the email after successful verification.
     */
    public static function deleteOtp($db, $email) {
        $del = $db->prepare("DELETE FROM otp_verifications WHERE email = ?");
        $del->execute([$email]);
    }

    /**
     * Send the OTP email using PHPMailer over SMTP.
     * Returns true on success, false on failure.
     */
    public static function sendEmail($email, $otp, &$errorMsg = '') {
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
            $mail->addAddress($email);

            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Your WearItNow Verification Code';
            $mail->Body    = self::buildEmailHtml($otp);
            $mail->AltBody = "Your WearItNow verification code is: $otp\n\nThis code will expire in 10 minutes.";

            $mail->send();
            return true;
        } catch (Exception $e) {
            $errorMsg = $mail->ErrorInfo;
            return false;
        }
    }

    /**
     * Build the HTML email body.
     */
    private static function buildEmailHtml($otp) {
        $digits = str_split($otp);
        $digitHtml = '';
        foreach ($digits as $d) {
            $digitHtml .= "<span style=\"display:inline-block;width:42px;height:52px;line-height:52px;text-align:center;background:#f4f4f5;border:2px solid #e4e4e7;border-radius:10px;font-size:28px;font-weight:700;color:#18181b;margin:0 4px;\">$d</span>";
        }
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
                    <p style='margin:6px 0 0;color:#a1a1aa;font-size:14px;'>Email Verification</p>
                  </td>
                </tr>
                <tr>
                  <td style='padding:40px;text-align:center;'>
                    <p style='font-size:16px;color:#3f3f46;margin:0 0 8px;'>Here is your verification code:</p>
                    <p style='font-size:13px;color:#a1a1aa;margin:0 0 28px;'>Enter this code in the app to confirm your email address.</p>
                    <div style='margin-bottom:28px;'>$digitHtml</div>
                    <p style='font-size:13px;color:#a1a1aa;margin:0;'>This code expires in <strong style='color:#18181b;'>10 minutes</strong>.</p>
                    <p style='font-size:13px;color:#a1a1aa;margin:8px 0 0;'>If you didn't request this, you can safely ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td style='background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #f4f4f5;'>
                    <p style='font-size:12px;color:#a1a1aa;margin:0;'>© " . date('Y') . " WearItNow. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>";
    }
}
?>
