<?php
// backend/src/Services/EsewaService.php

class EsewaService {
    private $secretKey;
    private $productCode;
    private $isSandbox;

    public function __construct($secretKey = '8gBm/:&EnhH.1/q', $productCode = 'EPAYTEST', $isSandbox = true) {
        $this->secretKey = $secretKey;
        $this->productCode = $productCode;
        $this->isSandbox = $isSandbox;
    }

    /**
     * Generate HMAC-SHA256 signature for eSewa v2
     * 1. Message: total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code} (NO SPACES)
     * 2. Secret Key: 8gBm/:&EnhH.1/q
     * 3. HMAC-SHA256 with binary output (true)
     * 4. Base64 encode the binary result
     */
    public function generateSignature($total_amount, $transaction_uuid) {
        $message = "total_amount=" . $total_amount . ",transaction_uuid=" . $transaction_uuid . ",product_code=" . $this->productCode;
        $signature = hash_hmac('sha256', $message, $this->secretKey, true);
        return base64_encode($signature);
    }

    /**
     * Verify payment status and signature from eSewa response data
     * Tries multiple keys to handle sandbox inconsistencies.
     */
    public function verifyPayment($encodedData) {
        $decodedData = json_decode(base64_decode($encodedData), true);
        
        if (!$decodedData) {
            return false;
        }

        // Verification Message Format Requirement:
        // transaction_code={transaction_code},status={status},total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code},signed_field_names={signed_field_names}
        $fields = [
            "transaction_code" => $decodedData['transaction_code'] ?? '',
            "status" => $decodedData['status'] ?? '',
            "total_amount" => $decodedData['total_amount'] ?? '',
            "transaction_uuid" => $decodedData['transaction_uuid'] ?? '',
            "product_code" => $decodedData['product_code'] ?? '',
            "signed_field_names" => $decodedData['signed_field_names'] ?? ''
        ];

        $messageParts = [];
        foreach ($fields as $key => $value) {
            $messageParts[] = "$key=$value";
        }
        $message = implode(',', $messageParts);
        
        // Try multiple keys (the provided one and the standard sandbox one)
        $keysToTry = [$this->secretKey, '8g7h96h9118t9rd'];
        
        foreach ($keysToTry as $key) {
            $signature = hash_hmac('sha256', $message, $key, true);
            $expectedSignature = base64_encode($signature);
            if ($expectedSignature === $decodedData['signature']) {
                return [
                    'success' => true,
                    'data' => $decodedData
                ];
            }
        }

        return [
            'success' => false,
            'message' => "Signature Mismatch. Message: '$message'"
        ];
    }

    public function getApiUrl() {
        return $this->isSandbox 
            ? "https://rc-epay.esewa.com.np/api/epay/main/v2/form" 
            : "https://epay.esewa.com.np/api/epay/main/v2/form";
    }

    public function getProductCode() {
        return $this->productCode;
    }
}
?>
