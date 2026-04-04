<?php
// backend/reprocess_all.php
// RUN VIA COMMAND LINE: php reprocess_all.php

require_once 'src/Config/Database.php';

echo "--- Starting Bulk AI Background Removal ---\n";

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed.\n");
}

// Find all products with Virtual Try-On enabled
$query = "SELECT id, name, image_url, try_on_image_url FROM products WHERE has_tryon = 1";
$stmt = $db->prepare($query);
$stmt->execute();

$products = $stmt->fetchAll(PDO::FETCH_ASSOC);
$total = count($products);
echo "Found $total products to process.\n\n";

$python_path = "python";
$script_path = __DIR__ . "/process_bg.py";
$uploads_dir = __DIR__ . "/uploads/";

$success_count = 0;
$fail_count = 0;

foreach ($products as $index => $product) {
    $current = $index + 1;
    echo "[$current/$total] Processing: " . $product['name'] . " (ID: " . $product['id'] . ")\n";
    
    $image_url = $product['image_url'];
    if (empty($image_url)) {
        echo "   - Skipping: No product image.\n";
        continue;
    }

    $file_name = basename($image_url);
    $input_path = $uploads_dir . $file_name;

    if (!file_exists($input_path)) {
        echo "   - Skipping: File not found at $input_path\n";
        continue;
    }

    $transparent_file_name = "transparent_" . $file_name;
    $output_path = $uploads_dir . $transparent_file_name;

    echo "   - Running AI background removal...\n";
    $command = escapeshellcmd("$python_path \"$script_path\" \"$input_path\" \"$output_path\"");
    exec($command, $output, $return_var);

    if ($return_var === 0) {
        $try_on_url = "http://localhost/e-commerce/backend/uploads/" . $transparent_file_name;
        
        // Update DB
        $update_query = "UPDATE products SET try_on_image_url = :url WHERE id = :id";
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(':url', $try_on_url);
        $update_stmt->bindParam(':id', $product['id']);
        
        if ($update_stmt->execute()) {
            echo "   - SUCCESS: Updated DB with $try_on_url\n";
            $success_count++;
        } else {
            echo "   - ERROR: Failed to update DB.\n";
            $fail_count++;
        }
    } else {
        echo "   - ERROR: Background removal failed for " . $product['name'] . "\n";
        echo "   - Python Output: " . implode("\n", $output) . "\n";
        $fail_count++;
    }
    
    // Tiny sleep to prevent CPU spike
    usleep(500000); 
}

echo "\n--- Processing Complete ---\n";
echo "Total: $total\n";
echo "Success: $success_count\n";
echo "Failed: $fail_count\n";
?>
