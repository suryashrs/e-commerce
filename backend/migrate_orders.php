<?php
include 'c:/xampp/htdocs/e-commerce/backend/src/Config/Database.php';
$db = (new Database())->getConnection();

// Since IF NOT EXISTS is not standard in older MariaDB, we catch exceptions.
try { $db->exec("ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL"); } catch (Exception $e) {}
try { $db->exec("ALTER TABLE orders ADD COLUMN email VARCHAR(255) NULL"); } catch (Exception $e) {}
try { $db->exec("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'cod'"); } catch (Exception $e) {}

echo "Migration complete";
