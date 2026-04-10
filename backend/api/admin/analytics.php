<?php
// backend/api/admin/analytics.php
// Returns: daily revenue (last 30 days) + active sellers with history
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include_once '../../src/Config/Database.php';

$database = new Database();
$db = $database->getConnection();

// ── 1. Daily Revenue (last 30 days) ─────────────────────────
$daily_query = "
    SELECT DATE(t.created_at) as date,
           SUM(t.amount) as revenue,
           SUM(t.platform_commission) as commission,
           COUNT(DISTINCT t.order_id) as orders
    FROM transactions t
    JOIN orders o ON t.order_id = o.id
    WHERE o.status = 'delivered'
      AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(t.created_at)
    ORDER BY date ASC
";
$daily_stmt = $db->prepare($daily_query);
$daily_stmt->execute();
$daily_data = $daily_stmt->fetchAll(PDO::FETCH_ASSOC);

// Fill missing days with zeros
$filled_daily = [];
for ($i = 29; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $found = null;
    foreach ($daily_data as $row) {
        if ($row['date'] === $date) { $found = $row; break; }
    }
    $filled_daily[] = [
        'date'       => $date,
        'label'      => date('M d', strtotime($date)),
        'revenue'    => $found ? (float)$found['revenue'] : 0,
        'commission' => $found ? (float)$found['commission'] : 0,
        'orders'     => $found ? (int)$found['orders'] : 0,
    ];
}

// ── 2. Monthly Revenue (last 12 months) ──────────────────────
$monthly_query = "
    SELECT DATE_FORMAT(t.created_at, '%Y-%m') as month,
           DATE_FORMAT(t.created_at, '%b %Y') as label,
           SUM(t.amount) as revenue,
           SUM(t.platform_commission) as commission,
           COUNT(DISTINCT t.order_id) as orders
    FROM transactions t
    JOIN orders o ON t.order_id = o.id
    WHERE o.status = 'delivered'
      AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
    ORDER BY month ASC
";
$monthly_stmt = $db->prepare($monthly_query);
$monthly_stmt->execute();
$monthly_data = $monthly_stmt->fetchAll(PDO::FETCH_ASSOC);

// ── 3. Active Sellers with full history ──────────────────────
$sellers_query = "
    SELECT 
        u.id,
        u.name,
        u.email,
        u.shop_name,
        u.shop_phone,
        u.shop_address,
        u.created_at as joined_at,
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COALESCE(SUM(t.platform_commission), 0) as total_commission,
        COALESCE(COUNT(DISTINCT t.order_id), 0) as total_orders,
        COALESCE(COUNT(DISTINCT p.id), 0) as total_products,
        MAX(t.created_at) as last_sale
    FROM users u
    LEFT JOIN transactions t ON t.seller_id = u.id
    LEFT JOIN orders o ON t.order_id = o.id AND o.status = 'delivered'
    LEFT JOIN products p ON p.seller_id = u.id
    WHERE u.role = 'seller' AND u.shop_status = 'approved'
    GROUP BY u.id
    ORDER BY total_revenue DESC
";
$sellers_stmt = $db->prepare($sellers_query);
$sellers_stmt->execute();
$sellers = $sellers_stmt->fetchAll(PDO::FETCH_ASSOC);

// ── 4. Category Sales Breakdown ───────────────────────────────
$category_query = "
    SELECT p.category,
           COUNT(DISTINCT oi.id) as units_sold,
           SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    GROUP BY p.category
    ORDER BY revenue DESC
";
$cat_stmt = $db->prepare($category_query);
$cat_stmt->execute();
$categories = $cat_stmt->fetchAll(PDO::FETCH_ASSOC);

// ── 5. Top Products ───────────────────────────────────────────
$top_products_query = "
    SELECT p.name, p.category,
           SUM(oi.quantity) as units_sold,
           SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    GROUP BY p.id
    ORDER BY revenue DESC
    LIMIT 10
";
$top_stmt = $db->prepare($top_products_query);
$top_stmt->execute();
$top_products = $top_stmt->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    'status'      => 200,
    'daily'       => $filled_daily,
    'monthly'     => array_values($monthly_data),
    'sellers'     => array_values($sellers),
    'categories'  => array_values($categories),
    'top_products'=> array_values($top_products),
]);
?>
