<?php
// WearIt Now - Backend PHP Script for Adding Product

// 1. Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die("Invalid request method. Please submit the form.");
}

// 2. Initialize an array for errors
$errors = [];

// 3. Retrieve and Sanitize Inputs
// Using trim to remove unnecessary spaces and htmlspecialchars to prevent XSS.
// For databases, prepare statements provide SQL Injection protection.

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

$price = isset($_POST['price']) ? trim($_POST['price']) : '';

$description = isset($_POST['description']) ? trim($_POST['description']) : '';
$description = htmlspecialchars($description, ENT_QUOTES, 'UTF-8');

$category = isset($_POST['category']) ? trim($_POST['category']) : '';
$category = htmlspecialchars($category, ENT_QUOTES, 'UTF-8');

$condition = isset($_POST['condition']) ? trim($_POST['condition']) : '';
$condition = htmlspecialchars($condition, ENT_QUOTES, 'UTF-8');

$sizes_array = isset($_POST['sizes']) && is_array($_POST['sizes']) ? $_POST['sizes'] : [];
$image_urls_raw = isset($_POST['image_urls']) && is_array($_POST['image_urls']) ? $_POST['image_urls'] : [];

// 4. Validation

// Price: Must be a number and non-negative
if (empty($price)) {
    $errors[] = "Price is required.";
} elseif (!is_numeric($price) || $price < 0) {
    $errors[] = "Price must be a valid positive number.";
} else {
    // Cast to float for strict typing
    $price = (float) $price;
}

// Image URLs: Extract non-empty URLs, sanitize, ensure at least one is provided
$valid_image_urls = [];
foreach ($image_urls_raw as $url) {
    $url = trim($url);
    if (!empty($url)) {
        // Sanitize the URL initially
        $sanitized_url = filter_var($url, FILTER_SANITIZE_URL);
        // Validate if it's a completely formed URL
        if (filter_var($sanitized_url, FILTER_VALIDATE_URL) !== false) {
            $valid_image_urls[] = $sanitized_url;
        }
    }
}

if (count($valid_image_urls) === 0) {
    $errors[] = "At least one valid image URL must be provided.";
}

// Additional Required Field Validation
if (empty($name)) $errors[] = "Product name is required.";
if (empty($category)) $errors[] = "Category is required.";
if (empty($condition)) $errors[] = "Condition is required.";

// 5. Data Transformation

// Convert 'Sizes' array to comma-separated string
// First, strictly sanitize the incoming size values
$sanitized_sizes = array_map(function($size) {
    return htmlspecialchars(trim($size), ENT_QUOTES, 'UTF-8');
}, $sizes_array);

$sizes_string = implode(',', $sanitized_sizes);


// 6. Security & Database Implementation Guidelines
// To prevent SQL Injection: Do NOT concatenate these variables directly into your SQL query string.
// Instead, use parameter bindings via PDO (PHP Data Objects) or MySQLi like the example below:

/*
try {
    $pdo = new PDO("mysql:host=localhost;dbname=ecommerce", "user", "password");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Prepare the statement with placeholders (?)
    $stmt = $pdo->prepare("INSERT INTO products (name, price, description, category, condition, sizes, images) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    // Process image array into a JSON payload for database storage (or a separate images table)
    $images_json = json_encode($valid_image_urls);
    
    // Execute the bound parameters, protecting against SQL injection automatically
    $stmt->execute([
        $name, 
        $price, 
        $description, 
        $category, 
        $condition, 
        $sizes_string, 
        $images_json
    ]);
    
    echo "Success!";
} catch (PDOException $e) {
    // Keep errors generic for end-users to avoid exposing schema information
    error_log($e->getMessage());
    die("A database error occurred.");
}
*/


// --- The Response Implementation For Testing / Display Purposes ---

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Process Results - WearIt Now</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-6 text-gray-800 font-sans">
    
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 border border-gray-200">
        <?php if (!empty($errors)): ?>
            
            <h2 class="text-2xl font-bold text-red-600 mb-4 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Errors Found
            </h2>
            <ul class="list-disc pl-5 mb-6 text-red-700 space-y-1">
                <?php foreach ($errors as $error): ?>
                    <li><?= htmlspecialchars($error) ?></li>
                <?php endforeach; ?>
            </ul>
            <button onclick="history.back()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition duration-200">
                &larr; Go Back
            </button>
            
        <?php else: ?>
            
            <h2 class="text-3xl font-bold text-green-600 mb-6 flex items-center">
                <svg class="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Product Processed Successfully!
            </h2>
            
            <div class="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100 space-y-3">
                <p><span class="font-semibold text-gray-500 w-24 inline-block">Name:</span> <span class="text-gray-900"><?= $name ?></span></p>
                <p><span class="font-semibold text-gray-500 w-24 inline-block">Price:</span> <span class="text-gray-900">Rs <?= number_format($price, 2) ?></span></p>
                <p><span class="font-semibold text-gray-500 w-24 inline-block">Category:</span> <span class="text-gray-900"><?= $category ?></span></p>
                <p><span class="font-semibold text-gray-500 w-24 inline-block">Condition:</span> <span class="text-gray-900"><?= $condition ?></span></p>
                <p><span class="font-semibold text-gray-500 w-24 inline-block">Sizes:</span> <span class="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1 rounded"><?= $sizes_string ?: "None specified" ?></span></p>
                <div class="mt-4 border-t pt-4">
                    <span class="font-semibold text-gray-500 block mb-2">Description:</span>
                    <p class="text-gray-700 whitespace-pre-wrap"><?= $description ?></p>
                </div>
            </div>
            
            <h3 class="font-semibold text-gray-800 mb-3 border-b pb-2">Image Resources</h3>
            <ul class="space-y-2 mb-8">
                <?php foreach ($valid_image_urls as $img): ?>
                    <li class="flex items-start">
                        <svg class="w-5 h-5 text-indigo-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        <a href="<?= htmlspecialchars($img) ?>" target="_blank" class="text-indigo-600 hover:text-indigo-800 truncate hover:underline flex-1"><?= htmlspecialchars($img) ?></a>
                    </li>
                <?php endforeach; ?>
            </ul>
            
            <div class="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start">
                <svg class="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p><strong>Note for Developer:</strong> The form data has been cleaned and formatted. It is now completely safe to be inserted into the database using the parameterized PDO queries demonstrated in the code comments.</p>
            </div>
            
        <?php endif; ?>
    </div>
</body>
</html>
