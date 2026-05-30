<?php
// backend/src/Services/EmailService.php

require_once __DIR__ . '/../../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../../lib/PHPMailer/SMTP.php';
require_once __DIR__ . '/../../lib/PHPMailer/Exception.php';
require_once __DIR__ . '/../../config/email.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService {

    /**
     * Send a generic email using PHPMailer over SMTP.
     * Returns true on success, false on failure.
     */
    public static function sendEmail($to, $subject, $body, $altBody = '', &$errorMsg = '') {
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
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            if ($altBody) {
                $mail->AltBody = $altBody;
            } else {
                $mail->AltBody = strip_tags(str_replace('<br>', "\n", $body));
            }

            $mail->send();
            return true;
        } catch (Exception $e) {
            $errorMsg = $mail->ErrorInfo;
            return false;
        }
    }
}
?>
