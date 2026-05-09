<?php
// Suppress PHP warnings/notices from polluting the JSON response
error_reporting(0);
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Always returns a clean JSON error and exits
function bail($errorMsg) {
    if (ob_get_length()) ob_clean();
    echo json_encode(["success" => false, "error" => $errorMsg]);
    exit();
}

if (!extension_loaded('gd')) {
    bail("PHP GD library is not enabled on this server. Please enable it in php.ini.");
}

try {

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    bail("Invalid request method");
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['person_image']) || !isset($data['garment_image'])) {
    bail("Missing required image data");
}

/**
 * Resizes and converts an image to JPEG (max 1024px) for Vertex AI.
 * Accepts either raw image bytes ($isBase64 = false) or a base64 string ($isBase64 = true).
 * Returns base64-encoded JPEG string, or false on failure.
 */
function processForVertexAI($imageData, $isBase64 = false) {
    $bytes = $isBase64 ? base64_decode($imageData) : $imageData;
    if (empty($bytes)) return false;

    $img = @imagecreatefromstring($bytes);
    if (!$img) return false;

    $w   = imagesx($img);
    $h   = imagesy($img);
    $max = 1024;

    if ($w > $max || $h > $max) {
        // Resize proportionally
        $scale   = min($max / $w, $max / $h);
        $nw      = (int)($w * $scale);
        $nh      = (int)($h * $scale);
        $resized = imagecreatetruecolor($nw, $nh);
        imagefill($resized, 0, 0, imagecolorallocate($resized, 255, 255, 255)); // white bg
        imagecopyresampled($resized, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($img);
        $img = $resized;
    } else {
        // Flatten any alpha/transparency onto white (required for JPEG)
        $flat = imagecreatetruecolor($w, $h);
        imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
        imagecopy($flat, $img, 0, 0, 0, 0, $w, $h);
        imagedestroy($img);
        $img = $flat;
    }

    // Encode to JPEG in memory
    ob_start();
    imagejpeg($img, null, 92);
    $out = ob_get_clean();
    imagedestroy($img);

    return empty($out) ? false : base64_encode($out);
}

// ── 1. Person Image (always a Data URL from the browser) ─────────────────────
$personBase64Raw   = preg_replace('/^data:image\/(.*?);base64,/', '', $data['person_image']);
$personImageBase64 = processForVertexAI($personBase64Raw, true);
if (!$personImageBase64) {
    bail("Failed to process person image. Ensure it is a valid JPG or PNG.");
}

// ── 2. Garment Image (Data URL from custom upload OR HTTP URL from catalog) ───
$garmentInput    = $data['garment_image'];
$garmentRawBytes = false;

if (strpos($garmentInput, 'data:image/') === 0) {
    // Custom upload — decode the Data URL directly
    $garmentRawBytes = base64_decode(preg_replace('/^data:image\/(.*?);base64,/', '', $garmentInput));
} else {
    // Catalog product — HTTP URL stored in the database
    // Try reading from the local filesystem first (avoids XAMPP self-request issues)
    if (strpos($garmentInput, 'http://localhost/e-commerce/backend/') !== false) {
        $decodedUrl   = rawurldecode($garmentInput);
        $relativePath = str_replace('http://localhost/e-commerce/backend/', '', $decodedUrl);
        $absPath      = realpath(__DIR__ . '/../' . $relativePath);
        if ($absPath && file_exists($absPath)) {
            $garmentRawBytes = file_get_contents($absPath);
        }
    }
    // Fallback: standard web fetch
    if ($garmentRawBytes === false) {
        $garmentRawBytes = @file_get_contents($garmentInput);
    }
    if ($garmentRawBytes === false) {
        bail("Failed to fetch garment image. URL: " . $garmentInput);
    }
}

$garmentImageBase64 = processForVertexAI($garmentRawBytes, false);
if (!$garmentImageBase64) {
    bail("Failed to process garment image. Ensure it is a valid JPG or PNG.");
}

// ── 3. Vertex AI Configuration ────────────────────────────────────────────────
$projectId = 'project-1d9bc125-6bb7-4a62-9e0';
$location  = 'us-central1';
$modelId   = 'virtual-try-on-001';

$output      = shell_exec('cmd /c "gcloud auth print-access-token" 2>&1');
$accessToken = trim($output);

if (empty($accessToken) || strpos($accessToken, ' ') !== false) {
    bail("Failed to get Vertex AI access token. Restart XAMPP and try again. Debug: " . $accessToken);
}

$endpoint = "https://{$location}-aiplatform.googleapis.com/v1/projects/{$projectId}/locations/{$location}/publishers/google/models/{$modelId}:predict";

// ── 4. Build payload ──────────────────────────────────────────────────────────
$payload = [
    "instances" => [
        [
            "personImage"   => ["image" => ["bytesBase64Encoded" => $personImageBase64]],
            "productImages" => [["image" => ["bytesBase64Encoded" => $garmentImageBase64]]]
        ]
    ],
    "parameters" => ["imageCount" => 1]
];

// ── 5. Call Vertex AI ─────────────────────────────────────────────────────────
$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $accessToken,
    "Content-Type: application/json; charset=utf-8"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// ── 6. Return result ──────────────────────────────────────────────────────────
if (ob_get_length()) ob_clean(); 

if ($httpCode == 200) {
    $result = json_decode($response, true);
    if (isset($result['predictions'][0]['bytesBase64Encoded'])) {
        echo json_encode([
            "success"   => true,
            "image_url" => "data:image/jpeg;base64," . $result['predictions'][0]['bytesBase64Encoded']
        ]);
    } else {
        echo json_encode(["success" => false, "error" => "Unexpected Vertex AI response: " . $response]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Vertex AI API Error (HTTP $httpCode): " . $response]);
}
exit();

} catch (Throwable $t) {
    bail("An internal server error occurred: " . $t->getMessage());
}
?>
