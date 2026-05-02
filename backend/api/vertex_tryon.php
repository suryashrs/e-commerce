<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['person_image']) || !isset($data['garment_image'])) {
    echo json_encode(["success" => false, "error" => "Missing required image data"]);
    exit();
}

// 1. Process Person Image (comes as a Data URL from frontend: data:image/jpeg;base64,...)
$personImageDataUrl = $data['person_image'];
$personImageBase64 = preg_replace('/^data:image\/(.*?);base64,/', '', $personImageDataUrl);

// 2. Process Garment Image (comes as an HTTP URL from the database)
$garmentImageUrl = $data['garment_image'];
$garmentImageContent = @file_get_contents($garmentImageUrl);
if ($garmentImageContent === false) {
    echo json_encode(["success" => false, "error" => "Failed to fetch garment image."]);
    exit();
}
$garmentImageBase64 = base64_encode($garmentImageContent);

// ==========================================
// GOOGLE VERTEX AI CONFIGURATION
// ==========================================
$projectId = 'project-1d9bc125-6bb7-4a62-9e0'; // Replace with your Project ID
$location = 'us-central1'; // Replace with your location (e.g. us-central1)
$modelId = 'virtual-try-on-001'; // Google Virtual Try-On Model

// Fetch the access token dynamically using the local gcloud CLI
// We use cmd /c and capture stderr to help debug path/auth issues in XAMPP
$output = shell_exec('cmd /c "gcloud auth print-access-token" 2>&1');
$accessToken = trim($output);

if (empty($accessToken) || strpos($accessToken, ' ') !== false) {
    echo json_encode([
        "success" => false, 
        "error" => "Failed to generate Vertex AI access token. If you just installed gcloud, please fully restart XAMPP.",
        "debug_output" => $accessToken
    ]);
    exit();
}

$endpoint = "https://{$location}-aiplatform.googleapis.com/v1/projects/{$projectId}/locations/{$location}/publishers/google/models/{$modelId}:predict";

// 3. Construct Payload for virtual-try-on-001
$payload = [
    "instances" => [
        [
            "personImage" => [
                "image" => [
                    "bytesBase64Encoded" => $personImageBase64
                ]
            ],
            "productImages" => [
                [
                    "image" => [
                        "bytesBase64Encoded" => $garmentImageBase64
                    ]
                ]
            ]
        ]
    ],
    "parameters" => [
        "imageCount" => 1
    ]
];

// --- MAKING THE REAL API CALL ---
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

if ($httpCode == 200) {
    $result = json_decode($response, true);
    // Parse the output according to Vertex AI response format
    // virtual-try-on-001 usually returns base64 images in predictions
    if (isset($result['predictions'][0]['bytesBase64Encoded'])) {
        $generatedImageBase64 = $result['predictions'][0]['bytesBase64Encoded'];
        echo json_encode(["success" => true, "image_url" => "data:image/jpeg;base64," . $generatedImageBase64]);
    } else {
        echo json_encode(["success" => false, "error" => "Unexpected response structure from Vertex AI."]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Vertex AI API Error: " . $response]);
}
exit();
?>
