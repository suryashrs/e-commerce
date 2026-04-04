import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import {
  Line, Bar, Doughnut
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import {
  TrendingUp, Users, ShoppingBag, DollarSign, Clock,
  Download, ArrowUpRight, ArrowDownRight, ChevronDown,
  ChevronUp, RefreshCw, Store, Package, Star, Eye,
  BarChart2, PieChart, Activity, CheckCircle, AlertCircle
} from "lucide-react";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── Helpers ───────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct = (a, b) => b === 0 ? 0 : (((a - b) / b) * 100).toFixed(1);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1f2937",
      titleColor: "#f9fafb",
      bodyColor: "#d1d5db",
      borderColor: "#374151",
      borderWidth: 1,
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: { color: "#1f2937" },
      ticks: { color: "#6b7280", font: { size: 10 } },
    },
    y: {
      grid: { color: "#1f2937" },
      ticks: { color: "#6b7280", font: { size: 10 } },
    },
  },
};

// ── CSV Download ──────────────────────────────────────────────────────
const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => Object.values(row).join(",")).join("\n");
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, color, trend, trendVal }) => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-3xl p-6 hover:scale-[1.02] transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color}/10`}>
        <Icon className={color.replace("bg-", "text-")} size={22} />
      </div>
      {trendVal !== undefined && (
        <span className={`text-xs font-bold flex items-center gap-1 ${trendVal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {trendVal >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trendVal)}%
        </span>
      )}
    </div>
    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
    <p className="text-3xl font-black text-white">{value}</p>
    {sub && <p className="text-indigo-400 text-xs font-bold mt-1">{sub}</p>}
  </div>
);

// ── Seller Row ────────────────────────────────────────────────────────
const SellerRow = ({ seller, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const rankColors = ["text-amber-400", "text-gray-300", "text-amber-600"];
  return (
    <div className="border border-gray-700/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 transition text-left"
      >
        <span className={`text-xl font-black w-8 shrink-0 ${rankColors[rank] || "text-gray-500"}`}>
          {rank < 3 ? ["🥇","🥈","🥉"][rank] : `#${rank + 1}`}
        </span>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0">
          {seller.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{seller.shop_name || seller.name}</p>
          <p className="text-gray-500 text-xs truncate">{seller.email}</p>
        </div>
        <div className="hidden sm:flex gap-6 text-right">
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
            <p className="text-sm font-black text-white">{fmt(seller.total_revenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Orders</p>
            <p className="text-sm font-black text-white">{seller.total_orders}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase">Products</p>
            <p className="text-sm font-black text-white">{seller.total_products}</p>
          </div>
        </div>
        <span className="text-gray-600 ml-2">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>

      {expanded && (
        <div className="bg-gray-900/50 border-t border-gray-700/50 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {[
            { label: "Total Revenue", value: fmt(seller.total_revenue), icon: "💰" },
            { label: "Commission Paid", value: fmt(seller.total_commission), icon: "🏦" },
            { label: "Total Orders", value: seller.total_orders, icon: "📦" },
            { label: "Products Listed", value: seller.total_products, icon: "🛍️" },
          ].map(item => (
            <div key={item.label} className="bg-gray-800/60 p-3 rounded-xl">
              <p className="text-lg mb-1">{item.icon}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">{item.label}</p>
              <p className="text-sm font-black text-white">{item.value}</p>
            </div>
          ))}
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div className="bg-gray-800/60 p-3 rounded-xl">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">📍 Shop Address</p>
              <p className="text-xs text-gray-300">{seller.shop_address || "Not provided"}</p>
            </div>
            <div className="bg-gray-800/60 p-3 rounded-xl">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">📅 Member Since</p>
              <p className="text-xs text-gray-300">{seller.joined_at ? new Date(seller.joined_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "Unknown"}</p>
              {seller.last_sale && (
                <>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 mt-2">🕐 Last Sale</p>
                  <p className="text-xs text-emerald-400">{new Date(seller.last_sale).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState("daily"); // daily | monthly
  const [activeTab, setActiveTab] = useState("overview"); // overview | sellers | products
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/stats.php`),
        axios.get(`${API_BASE_URL}/admin/analytics.php`),
      ]);
      if (statsRes.data.status === 200 || statsRes.data.revenue) {
        setStats(statsRes.data.body || statsRes.data);
      }
      if (analyticsRes.data.status === 200) {
        setAnalytics(analyticsRes.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      <p className="text-gray-500 text-sm font-bold animate-pulse">Loading Analytics...</p>
    </div>
  );

  // ── Chart data ────────────────────────────────────────────────────
  const chartData = chartMode === "daily" ? analytics?.daily : analytics?.monthly;
  const labels = chartData?.map(d => d.label) ?? [];
  const revenueData = chartData?.map(d => d.revenue) ?? [];
  const commissionData = chartData?.map(d => d.commission) ?? [];
  const ordersData = chartData?.map(d => d.orders) ?? [];

  const lineChartData = {
    labels,
    datasets: [
      {
        label: "GMV Revenue",
        data: revenueData,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: "Commission",
        data: commissionData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.05)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      }
    ],
  };

  const barChartData = {
    labels,
    datasets: [
      {
        label: "Orders",
        data: ordersData,
        backgroundColor: "rgba(139,92,246,0.7)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const categoryLabels = analytics?.categories?.map(c => c.category) ?? [];
  const categoryRevenues = analytics?.categories?.map(c => parseFloat(c.revenue)) ?? [];
  const categoryColors = ["#6366f1","#10b981","#f59e0b","#ef4444","#ec4899","#8b5cf6","#14b8a6","#f97316"];

  const doughnutData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryRevenues,
      backgroundColor: categoryColors.slice(0, categoryLabels.length),
      borderColor: "#111827",
      borderWidth: 2,
    }],
  };

  // ── Derived stats ─────────────────────────────────────────────────
  const todayRevenue = stats?.revenue?.today ?? 0;
  const yesterdayRevenue = stats?.revenue?.yesterday ?? 0;
  const trend7 = pct(stats?.revenue?.last7days ?? 0, (analytics?.daily?.slice(-14, -7).reduce((a, b) => a + b.revenue, 0)) ?? 1);

  const totalSellerRevenue = analytics?.sellers?.reduce((a, b) => a + parseFloat(b.total_revenue || 0), 0) ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <header className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Analytics Console</h1>
          <p className="text-gray-400 mt-1 text-sm">Platform revenue, sales, and merchant intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <div className="bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-xl text-xs font-bold text-gray-400">
            <Clock className="inline mr-2" size={13} />
            {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* ── Nav Tabs ── */}
      <div className="flex gap-2 p-1 bg-gray-800/50 rounded-2xl w-fit border border-gray-700/50">
        {[
          { key: "overview", label: "Overview", icon: BarChart2 },
          { key: "sellers", label: "Active Sellers", icon: Users },
          { key: "products", label: "Top Products", icon: Package },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Revenue Today" icon={TrendingUp} color="bg-indigo-500"
              value={fmt(todayRevenue)}
              sub={`${fmt(stats?.revenue?.platform_today)} Commission`}
              trendVal={parseFloat(pct(todayRevenue, yesterdayRevenue))}
            />
            <StatCard
              title="Last 7 Days" icon={Activity} color="bg-emerald-500"
              value={fmt(stats?.revenue?.last7days)}
              sub={`${fmt(stats?.revenue?.platform_7days)} Commission`}
              trendVal={parseFloat(trend7)}
            />
            <StatCard
              title="Platform Revenue" icon={DollarSign} color="bg-amber-500"
              value={fmt(stats?.revenue?.platform_lifetime)}
              sub="All-time commission"
            />
            <StatCard
              title="Total GMV" icon={ShoppingBag} color="bg-purple-500"
              value={fmt(stats?.revenue?.lifetime)}
              sub={`${stats?.counts?.completed_orders || 0} Completed Orders`}
            />
          </div>

          {/* ── Secondary Metrics ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Active Sellers", val: stats?.counts?.active_sellers ?? 0, icon: Store, color: "bg-cyan-500" },
              { label: "Pending Requests", val: stats?.counts?.pending_shops ?? 0, icon: AlertCircle, color: "bg-amber-500" },
              { label: "Total Products", val: stats?.counts?.total_products ?? 0, icon: Package, color: "bg-pink-500" },
              { label: "Flagged Products", val: stats?.counts?.flagged_products ?? 0, icon: Eye, color: "bg-rose-500" },
            ].map(m => (
              <div key={m.label} className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4 flex items-center gap-4">
                <div className={`${m.color}/10 p-3 rounded-xl`}>
                  <m.icon className={m.color.replace("bg-", "text-")} size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{m.val}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Revenue Chart ── */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-6">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
                <p className="text-gray-500 text-xs mt-1">GMV and platform commission over time</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-gray-900/60 p-1 rounded-xl border border-gray-700/50">
                  {["daily", "monthly"].map(m => (
                    <button
                      key={m}
                      onClick={() => setChartMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === m ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white"}`}
                    >
                      {m === "daily" ? "30 Days" : "12 Months"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => downloadCSV(chartData?.map(d => ({ date: d.date || d.month, revenue: d.revenue, commission: d.commission, orders: d.orders })), `revenue_${chartMode}`)}
                  className="flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-600/30 transition"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
            </div>
            {/* Legend */}
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block shadow-lg" /> GMV</span>
              <span className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-lg" /> Commission</span>
            </div>
            <div style={{ height: 280 }}>
              <Line
                data={lineChartData}
                options={{
                  ...chartDefaults,
                  plugins: {
                    ...chartDefaults.plugins,
                    legend: { display: false },
                    tooltip: {
                      ...chartDefaults.plugins.tooltip,
                      callbacks: {
                        label: ctx => ` Rs. ${ctx.parsed.y.toLocaleString("en-IN")}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* ── Orders Bar + Category Doughnut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800/30 border border-gray-700/50 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Orders Volume</h2>
                  <p className="text-gray-500 text-xs mt-1">Delivered orders per period</p>
                </div>
                <button
                  onClick={() => downloadCSV(chartData?.map(d => ({ period: d.label, orders: d.orders })), `orders_${chartMode}`)}
                  className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-purple-600/30 transition"
                >
                  <Download size={13} /> CSV
                </button>
              </div>
              <div style={{ height: 220 }}>
                <Bar
                  data={barChartData}
                  options={{
                    ...chartDefaults,
                    plugins: { ...chartDefaults.plugins, legend: { display: false } },
                    scales: {
                      ...chartDefaults.scales,
                      y: { ...chartDefaults.scales.y, beginAtZero: true, ticks: { ...chartDefaults.scales.y.ticks, stepSize: 1 } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Sales by Category</h2>
                  <p className="text-gray-500 text-xs mt-1">Revenue distribution</p>
                </div>
                <button
                  onClick={() => downloadCSV(analytics?.categories, "category_sales")}
                  className="flex items-center gap-1 text-gray-500 hover:text-white text-xs font-bold transition"
                >
                  <Download size={13} />
                </button>
              </div>
              {categoryLabels.length > 0 ? (
                <>
                  <div style={{ height: 160 }}>
                    <Doughnut
                      data={doughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: ctx => ` Rs. ${ctx.parsed.toLocaleString("en-IN")}`,
                            },
                          },
                        },
                        cutout: "70%",
                      }}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    {analytics.categories.slice(0, 5).map((c, i) => (
                      <div key={c.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[i] }} />
                          <span className="text-xs text-gray-400 truncate max-w-[100px]">{c.category}</span>
                        </div>
                        <span className="text-xs font-bold text-white">{fmt(c.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No category data</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          TAB: ACTIVE SELLERS
      ══════════════════════════════════════════════ */}
      {activeTab === "sellers" && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Active Merchants</h2>
              <p className="text-gray-400 text-sm mt-1">{analytics?.sellers?.length ?? 0} active sellers · total GMV {fmt(totalSellerRevenue)}</p>
            </div>
            <button
              onClick={() => downloadCSV(analytics?.sellers?.map(s => ({
                id: s.id, name: s.name, shop: s.shop_name || "", email: s.email,
                total_revenue: s.total_revenue, commission: s.total_commission,
                orders: s.total_orders, products: s.total_products,
                joined: s.joined_at, last_sale: s.last_sale || ""
              })), "active_sellers")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg"
            >
              <Download size={16} /> Download Full Report
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Sellers", val: analytics?.sellers?.length ?? 0 },
              { label: "Total Revenue", val: fmt(totalSellerRevenue) },
              { label: "Total Orders", val: analytics?.sellers?.reduce((a, b) => a + parseInt(b.total_orders || 0), 0) },
              { label: "Avg. Revenue", val: analytics?.sellers?.length ? fmt(totalSellerRevenue / analytics.sellers.length) : "Rs. 0" },
            ].map(m => (
              <div key={m.label} className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-white">{m.val}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Seller list */}
          <div className="space-y-3">
            {analytics?.sellers?.length > 0 ? (
              analytics.sellers.map((seller, index) => (
                <SellerRow key={seller.id} seller={seller} rank={index} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <CheckCircle className="text-gray-700 mb-4" size={48} />
                <p className="text-gray-400 font-bold">No active sellers yet.</p>
                <p className="text-gray-600 text-sm mt-1">Sellers will appear here once they are approved.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: TOP PRODUCTS
      ══════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Top Performing Products</h2>
              <p className="text-gray-400 text-sm mt-1">Ranked by revenue from delivered orders.</p>
            </div>
            <button
              onClick={() => downloadCSV(analytics?.top_products, "top_products")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="bg-gray-800/30 border border-gray-700/50 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-700/50">
              <span className="col-span-1">#</span>
              <span className="col-span-5">Product</span>
              <span className="col-span-2 text-center">Units Sold</span>
              <span className="col-span-2 text-right">Revenue</span>
              <span className="col-span-2 text-right">Avg/Unit</span>
            </div>
            {analytics?.top_products?.length > 0 ? analytics.top_products.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-12 px-6 py-4 border-b border-gray-700/30 hover:bg-gray-800/40 transition items-center"
              >
                <span className="col-span-1 text-gray-500 font-black text-sm">#{i + 1}</span>
                <div className="col-span-5">
                  <p className="text-white font-bold text-sm truncate">{p.name}</p>
                  <p className="text-gray-500 text-xs">{p.category}</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-white font-bold text-sm">{p.units_sold}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-emerald-400 font-bold text-sm">{fmt(p.revenue)}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-gray-400 text-sm">{fmt(p.units_sold > 0 ? p.revenue / p.units_sold : 0)}</span>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-gray-500">No product data available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
