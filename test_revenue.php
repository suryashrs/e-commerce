<?php
include_once 'backend/src/Config/Database.php';

$db = (new Database())->getConnection();

echo "ORDERS:\n";
$stmt = $db->query("SELECT id, status, created_at, payment_method FROM orders ORDER BY id DESC LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Order ID: {$row['id']} | Status: {$row['status']} | Created: {$row['created_at']} | Payment: {$row['payment_method']}\n";
}

echo "\nTRANSACTIONS:\n";
$stmt = $db->query("SELECT id, order_id, amount, platform_commission, created_at FROM transactions ORDER BY id DESC LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Tx ID: {$row['id']} | Order ID: {$row['order_id']} | Amount: {$row['amount']} | Created: {$row['created_at']}\n";
}

echo "\nREVENUE STATS (AdminController):\n";
include_once 'backend/src/Models/Transaction.php';
$tx = new Transaction($db);
print_r($tx->getRevenueStats('today'));
print_r($tx->getRevenueStats('yesterday'));
print_r($tx->getRevenueStats('all'));
