<?php
// /tmp/check_db.php
$host = "localhost";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $stmt = $pdo->query("SHOW DATABASES");
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo implode(", ", $dbs);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
