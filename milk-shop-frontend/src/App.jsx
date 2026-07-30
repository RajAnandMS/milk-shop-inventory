import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const CATEGORY_ICONS = {
  milk: "🥛",
  curd: "🍶",
  "ice cream": "🍨",
  butter: "🧈",
  ghee: "🫙",
  paneer: "🧀",
};

function categoryIcon(name = "") {
  return CATEGORY_ICONS[name.toLowerCase()] || "📦";
}

const HOURLY_SLOTS = [
  "6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
  "12 PM","1 PM","2 PM","3 PM","4 PM","5 PM",
  "6 PM","7 PM","8 PM",
];

function getStatus(product) {
  if (product.currentStock === 0) return "out";
  if (product.currentStock <= product.lowStockAlert) return "low";
  return "available";
}

function todayStr() {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function formatDateTime(dateTime) {
  if (!dateTime) return "—";

  const date = new Date(dateTime);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const STATUS_COLORS = {
  available: { bg: "#e6f9f0", text: "#1a7a4a", dot: "#22c55e" },
  low: { bg: "#fff7e6", text: "#a05c00", dot: "#f59e0b" },
  out: { bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444" },
};

const STATUS_LABELS = { available: "Available", low: "Low Stock", out: "Out of Stock" };

export default function MilkShopApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editProduct, setEditProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSellModal, setShowSellModal] = useState(null);
  const [showStockModal, setShowStockModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [historyFilter, setHistoryFilter] = useState({ date: "", category: "all", product: "all" });
  const [reportType, setReportType] = useState("daily");
  const [newProduct, setNewProduct] = useState({ name: "", categoryId: "", defaultStock: 50, currentStock: 50, unitsSold: 0, lowStockAlert: 10, unit: "Packets" });
  const [loading, setLoading] = useState(true);
  const [auditLog, setAuditLog] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalQuantitySold: 0,
    totalSalesCount: 0,
    bestSellingProduct: "No sales yet",
    lowStockProducts: [],
  });
  const [hourlySales, setHourlySales] = useState(() => {
    const init = {};
    HOURLY_SLOTS.forEach(h => { init[h] = {}; });
    return init;
  });
  const [graphProduct, setGraphProduct] = useState("all");

  const dm = darkMode;

  const showNotif = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);
  const loadAppData = useCallback(async () => {
    setLoading(true);
    try {
     const [
       categoryResponse,
       productResponse,
       inventoryResponse,
       salesResponse,
       dashboardResponse,
     ] = await Promise.all([
       axios.get(`${API_BASE_URL}/categories`),
       axios.get(`${API_BASE_URL}/products`),
       axios.get(`${API_BASE_URL}/inventory`),
       axios.get(`${API_BASE_URL}/sales`).catch(() => ({ data: [] })),
       axios.get(`${API_BASE_URL}/dashboard/today`).catch(() => ({
         data: {
           totalQuantitySold: 0,
           totalSalesCount: 0,
           bestSellingProduct: "No sales yet",
           lowStockProducts: [],
         },
       })),
     ]);

      const categoryData = (categoryResponse.data || [])
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map(category => ({ ...category, icon: categoryIcon(category.name) }));

      setCategories(categoryData);
      setDashboardData({
        totalQuantitySold: dashboardResponse.data?.totalQuantitySold ?? 0,
        totalSalesCount: dashboardResponse.data?.totalSalesCount ?? 0,
        bestSellingProduct:
          dashboardResponse.data?.bestSellingProduct || "No sales yet",
        lowStockProducts: dashboardResponse.data?.lowStockProducts || [],
      });
      setNewProduct(prev => ({
        ...prev,
        categoryId: prev.categoryId || String(categoryData[0]?.id || ""),
      }));

      const inventories = inventoryResponse.data || [];
      const today = getLocalDateKey();

      const todayInventory = inventories.filter(
          inventory => inventory.businessDate === today
      );

      const inventoryByProduct = new Map();

      todayInventory.forEach(inventory => {
          inventoryByProduct.set(inventory.product.id, inventory);
      });

      const mergedProducts = (productResponse.data || []).map(product => {
        const inventory = inventoryByProduct.get(product.id);
        return {
          ...product,
          categoryId: String(product.category?.id ?? ""),
          inventoryId: inventory?.id ?? null,
          currentStock: inventory?.currentStock ?? product.defaultStock ?? 0,
          unitsSold: inventory?.unitsSold ?? 0,
          businessDate: inventory?.businessDate ?? null,
        };
      });
      setProducts(mergedProducts);

      const historicalRows = inventories
        .filter(item => item.businessDate !== today)
        .map(item => ({
          date: item.businessDate,
          dateLabel: new Date(`${item.businessDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          productId: item.product?.id,
          productName: item.product?.name || "Unknown product",
          categoryId: String(item.product?.category?.id ?? ""),
          openingStock: item.product?.defaultStock ?? 0,
          unitsSold: item.unitsSold ?? 0,
          closingStock: item.currentStock ?? 0,
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
      setHistory(historicalRows);

      const sales = salesResponse.data || [];



      setRecentUpdates(sales.slice(-10).reverse().map(sale => ({
        id: sale.id,
        time: formatDateTime(sale.saleTime),
        product: sale.product?.name || "Unknown product",
        action: `Sold ${sale.quantity} ${sale.product?.unit || "units"}`,
        remaining:
          mergedProducts.find(p => p.id === sale.product?.id)?.currentStock ?? 0,
      })));

     const nextHourly = {};

     HOURLY_SLOTS.forEach(slot => {
       nextHourly[slot] = {};
     });

     sales
       .filter(sale => sale.saleDate === today)
       .forEach(sale => {
         if (!sale.saleTime || !sale.product?.id) return;

         const saleDateTime = new Date(sale.saleTime);

         if (Number.isNaN(saleDateTime.getTime())) return;

         const hour = saleDateTime.getHours();

         const label =
           hour < 12
             ? `${hour === 0 ? 12 : hour} AM`
             : `${hour === 12 ? 12 : hour - 12} PM`;

         if (!nextHourly[label]) return;

         const productId = sale.product.id;
         const quantity = Number(sale.quantity || 0);

         nextHourly[label][productId] =
           (nextHourly[label][productId] || 0) + quantity;
       });

     console.log("Sales graph data:", nextHourly);

     setHourlySales(nextHourly);
    } catch (error) {
      console.error("Unable to load backend data:", error);
      showNotif(error.response?.data?.message || "Unable to connect to the backend", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotif]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  useEffect(() => {
    const lows = products.filter(p => getStatus(p) !== "available");
    setAlerts(lows.map(p => ({
      id: p.id,
      msg: getStatus(p) === "out"
        ? `${p.name} is OUT OF STOCK`
        : `${p.name} is running low (${p.currentStock} left)`,
      type: getStatus(p) === "out" ? "out" : "low",
    })));
  }, [products]);

  const addAudit = useCallback((action, productName, detail) => {
    setAuditLog(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      date: todayStr(),
      action,
      productName,
      detail,
    }, ...prev.slice(0, 49)]);
  }, []);

  const handleSell = async (product, qty) => {
    if (!Number.isInteger(qty) || qty <= 0 || qty > product.currentStock) {
      showNotif("Enter a valid sale quantity", "error");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/sales`, { productId: product.id, quantity: qty });
      addAudit("Sale", product.name, `Sold ${qty} ${product.unit}`);
      setShowSellModal(null);
      showNotif(`Sale recorded for ${product.name}`);
      await loadAppData();
    } catch (error) {
      showNotif(error.response?.data?.message || "Unable to record sale", "error");
    }
  };

  const handleRestock = async (product, qty) => {
    if (!Number.isInteger(qty) || qty <= 0) {
      showNotif("Enter a valid restock quantity", "error");
      return;
    }
    if (!product.inventoryId) {
      showNotif("No inventory row exists for this product today", "error");
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/inventory/${product.inventoryId}/restock`, { quantity: qty });
      addAudit("Restock", product.name, `Added ${qty} ${product.unit}`);
      setShowStockModal(null);
      showNotif(`${product.name} restocked successfully`);
      await loadAppData();
    } catch (error) {
      showNotif(error.response?.data?.message || "Unable to restock product", "error");
    }
  };

  const handlePrepareNextDay = async () => {
    try {
      await axios.post(`${API_BASE_URL}/inventory/prepare-next-day`);
      addAudit("Day Reset", "All Products", "Tomorrow's inventory was prepared");
      showNotif("Tomorrow's inventory has been prepared");
      await loadAppData();
    } catch (error) {
      showNotif(error.response?.data?.message || "Unable to prepare the next day", "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    const product = products.find(item => item.id === id);
    if (!window.confirm(`Delete ${product?.name || "this product"}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`);
      addAudit("Delete", product?.name || "Unknown", "Product removed");
      showNotif("Product deleted");
      await loadAppData();
    } catch (error) {
      showNotif(error.response?.data?.message || "Unable to delete product", "error");
    }
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        name: editProduct.name.trim(),
        category: { id: Number(editProduct.categoryId) },
        defaultStock: Number(editProduct.defaultStock),
        lowStockAlert: Number(editProduct.lowStockAlert),
        unit: editProduct.unit.trim(),
      };
      await axios.put(`${API_BASE_URL}/products/${editProduct.id}`, payload);
      addAudit("Edit", editProduct.name, "Product details updated");
      setEditProduct(null);
      showNotif("Product updated");
      await loadAppData();
    } catch (error) {
      showNotif(error.response?.data?.message || "Unable to update product", "error");
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.categoryId) {
      showNotif("Product name and category are required", "error");
      return;
    }
    try {
      const payload = {
        name: newProduct.name.trim(),
        category: { id: Number(newProduct.categoryId) },
        defaultStock: Number(newProduct.defaultStock),
        lowStockAlert: Number(newProduct.lowStockAlert),
        unit: newProduct.unit.trim(),
      };
      await axios.post(`${API_BASE_URL}/products`, payload);
      addAudit("Add", newProduct.name, "New product added");
      setShowAddProduct(false);
      setNewProduct({
        name: "",
        categoryId: String(categories[0]?.id || ""),
        defaultStock: 50,
        currentStock: 50,
        unitsSold: 0,
        lowStockAlert: 10,
        unit: "Packets",
      });
      showNotif("Product added");
      await loadAppData();
    } catch (error) {
      showNotif(error.response?.data?.message || "Unable to add product", "error");
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || String(p.categoryId) === String(filterCat);
    const matchStatus = filterStatus === "all" || getStatus(p) === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalStock = products.reduce((s, p) => s + p.currentStock, 0);
  const totalSold = dashboardData.totalQuantitySold;
  const lowCount = products.filter(p => getStatus(p) === "low").length;
  const outCount = products.filter(p => getStatus(p) === "out").length;

  const getCategoryName = (id) => categories.find(c => String(c.id) === String(id))?.name || "Unknown";

  const filteredHistory = history.filter(h => {
    if (historyFilter.date && h.date !== historyFilter.date) return false;
    if (historyFilter.category !== "all" && String(h.categoryId) !== String(historyFilter.category)) return false;
    if (historyFilter.product !== "all" && h.productId !== parseInt(historyFilter.product)) return false;
    return true;
  });

  const reportData = useCallback(() => {
    if (!history.length) return null;
    const grouped = {};
    history.forEach(h => {
      if (!grouped[h.productId]) grouped[h.productId] = { name: h.productName, totalSold: 0, records: [] };
      grouped[h.productId].totalSold += h.unitsSold;
      grouped[h.productId].records.push(h);
    });
    const sorted = Object.values(grouped).sort((a, b) => b.totalSold - a.totalSold);
    return { best: sorted.slice(0, 3), least: sorted.slice(-3).reverse() };
  }, [history]);

  const css = {
    app: { minHeight: "100vh", display: "flex", background: dm ? "#0f1117" : "#f5f7fa", fontFamily: "system-ui, -apple-system, sans-serif", color: dm ? "#e2e8f0" : "#1a202c" },
    sidebar: { width: sidebarOpen ? 240 : 60, background: dm ? "#1a1f2e" : "#1a2744", transition: "width 0.2s", display: "flex", flexDirection: "column", minHeight: "100vh", flexShrink: 0 },
    main: { flex: 1, overflow: "auto", minWidth: 0 },
    header: { background: dm ? "#1a1f2e" : "#fff", borderBottom: `1px solid ${dm ? "#2d3748" : "#e2e8f0"}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 10 },
    card: { background: dm ? "#1e2535" : "#fff", borderRadius: 12, border: `1px solid ${dm ? "#2d3748" : "#e8ecf0"}`, padding: "20px 24px" },
    input: { background: dm ? "#2d3748" : "#f9fafb", border: `1px solid ${dm ? "#4a5568" : "#d1d5db"}`, borderRadius: 8, padding: "8px 12px", color: dm ? "#e2e8f0" : "#1a202c", fontSize: 14, width: "100%", outline: "none" },
    btn: (variant = "default") => ({
      padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", transition: "opacity 0.15s",
      ...(variant === "primary" ? { background: "#2563eb", color: "#fff" } :
        variant === "success" ? { background: "#16a34a", color: "#fff" } :
        variant === "danger" ? { background: "#dc2626", color: "#fff" } :
        variant === "warning" ? { background: "#d97706", color: "#fff" } :
        variant === "ghost" ? { background: "transparent", color: dm ? "#94a3b8" : "#6b7280", border: `1px solid ${dm ? "#374151" : "#d1d5db"}` } :
        { background: dm ? "#374151" : "#f3f4f6", color: dm ? "#e2e8f0" : "#374151" })
    }),
    badge: (status) => ({
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].text,
    }),
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: 12, padding: sidebarOpen ? "10px 20px" : "10px", cursor: "pointer",
      color: active ? "#fff" : "#94a3b8", background: active ? "rgba(255,255,255,0.12)" : "transparent",
      borderRadius: 8, margin: "2px 8px", transition: "all 0.15s", fontSize: 14,
    }),
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modalBox: { background: dm ? "#1e2535" : "#fff", borderRadius: 16, padding: 28, width: "min(480px, 90vw)", maxHeight: "85vh", overflowY: "auto" },
    label: { fontSize: 12, fontWeight: 600, color: dm ? "#94a3b8" : "#6b7280", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: dm ? "#64748b" : "#9ca3af", borderBottom: `1px solid ${dm ? "#2d3748" : "#e5e7eb"}` },
    td: { padding: "12px 12px", borderBottom: `1px solid ${dm ? "#1e2535" : "#f3f4f6"}`, verticalAlign: "middle" },
  };

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "⊟" },
    { id: "products", label: "Products", icon: "📦" },
    { id: "sales", label: "Sales Entry", icon: "💸" },
    { id: "salesgraph", label: "Sales Graph", icon: "📈" },
    { id: "history", label: "History", icon: "📋" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "alerts", label: `Alerts ${alerts.length > 0 ? `(${alerts.length})` : ""}`, icon: "🔔" },
    { id: "audit", label: "Audit Log", icon: "📝" },
  ];

  const SellModal = ({ product, onClose }) => {
    const [qty, setQty] = useState("");
    return (
      <div style={css.modal} onClick={onClose}>
        <div style={css.modalBox} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>Record Sale</h3>
          <p style={{ margin: "0 0 20px", color: dm ? "#94a3b8" : "#6b7280", fontSize: 14 }}>{product.name}</p>
          <div style={{ background: dm ? "#0f1117" : "#f9fafb", borderRadius: 10, padding: 16, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><div style={css.label}>Opening Stock</div><div style={{ fontSize: 20, fontWeight: 600 }}>{product.defaultStock}</div></div>
            <div><div style={css.label}>Current Stock</div><div style={{ fontSize: 20, fontWeight: 600, color: product.currentStock <= product.lowStockAlert ? "#ef4444" : "#22c55e" }}>{product.currentStock}</div></div>
            <div><div style={css.label}>Already Sold</div><div style={{ fontSize: 20, fontWeight: 600 }}>{product.unitsSold}</div></div>
            <div><div style={css.label}>Unit</div><div style={{ fontSize: 14, marginTop: 4 }}>{product.unit}</div></div>
          </div>
          <label style={css.label}>Quantity Sold</label>
          <input style={{ ...css.input, fontSize: 18, marginBottom: 20 }} type="number" min="1" max={product.currentStock}
            value={qty} onChange={e => setQty(e.target.value)} placeholder="Enter quantity..." autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...css.btn("success"), flex: 1, padding: "10px" }} onClick={() => handleSell(product, parseInt(qty))}>Confirm Sale</button>
            <button style={{ ...css.btn("ghost"), flex: 1, padding: "10px" }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const RestockModal = ({ product, onClose }) => {
    const [qty, setQty] = useState("");
    return (
      <div style={css.modal} onClick={onClose}>
        <div style={css.modalBox} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>Restock Product</h3>
          <p style={{ margin: "0 0 20px", color: dm ? "#94a3b8" : "#6b7280", fontSize: 14 }}>{product.name}</p>
          <div style={{ background: dm ? "#0f1117" : "#f9fafb", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={css.label}>Current Stock</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{product.currentStock} {product.unit}</div>
          </div>
          <label style={css.label}>Add Quantity</label>
          <input style={{ ...css.input, fontSize: 18, marginBottom: 20 }} type="number" min="1"
            value={qty} onChange={e => setQty(e.target.value)} placeholder="Enter quantity..." autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...css.btn("primary"), flex: 1, padding: "10px" }} onClick={() => handleRestock(product, parseInt(qty))}>Add Stock</button>
            <button style={{ ...css.btn("ghost"), flex: 1, padding: "10px" }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const EditModal = ({ product, onClose }) => (
    <div style={css.modal} onClick={onClose}>
      <div style={css.modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18 }}>Edit Product</h3>
        {[
          { label: "Product Name", key: "name", type: "text" },
          { label: "Default Daily Stock", key: "defaultStock", type: "number" },
          { label: "Low Stock Alert Level", key: "lowStockAlert", type: "number" },
          { label: "Unit", key: "unit", type: "text" },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={css.label}>{label}</label>
            <input style={css.input} type={type} value={product[key]}
              onChange={e => setEditProduct(prev => ({ ...prev, [key]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))} />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <label style={css.label}>Category</label>
          <select style={css.input} value={product.categoryId} onChange={e => setEditProduct(prev => ({ ...prev, categoryId: e.target.value }))}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...css.btn("primary"), flex: 1 }} onClick={handleSaveEdit}>Save Changes</button>
          <button style={{ ...css.btn("ghost"), flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const AddModal = () => (
    <div style={css.modal} onClick={() => setShowAddProduct(false)}>
      <div style={css.modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18 }}>Add New Product</h3>
        {[
          { label: "Product Name", key: "name", type: "text" },
          { label: "Default Daily Stock", key: "defaultStock", type: "number" },
          { label: "Low Stock Alert Level", key: "lowStockAlert", type: "number" },
          { label: "Unit", key: "unit", type: "text" },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={css.label}>{label}</label>
            <input style={css.input} type={type} value={newProduct[key]}
              onChange={e => setNewProduct(prev => ({ ...prev, [key]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))} placeholder={label} />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <label style={css.label}>Category</label>
          <select style={css.input} value={newProduct.categoryId} onChange={e => setNewProduct(prev => ({ ...prev, categoryId: e.target.value }))}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...css.btn("primary"), flex: 1 }} onClick={handleAddProduct}>Add Product</button>
          <button style={{ ...css.btn("ghost"), flex: 1 }} onClick={() => setShowAddProduct(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>Dashboard</h2>
        <p style={{ margin: 0, color: dm ? "#64748b" : "#9ca3af", fontSize: 14 }}>{todayStr()}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Products", value: products.length, icon: "📦", color: "#2563eb", bg: "#eff6ff" },
          { label: "Total Stock Available", value: totalStock.toLocaleString(), icon: "🥛", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Units Sold Today", value: totalSold.toLocaleString(), icon: "💸", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Running Low", value: lowCount, icon: "⚠️", color: "#d97706", bg: "#fffbeb" },
          { label: "Out of Stock", value: outCount, icon: "🚨", color: "#dc2626", bg: "#fef2f2" },
          {
            label: "Sales Transactions",
            value: dashboardData.totalSalesCount,
            icon: "🧾",
            color: "#0891b2",
            bg: "#ecfeff",
          },
        ].map(card => (
          <div key={card.label} style={{ ...css.card, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: dm ? "rgba(255,255,255,0.08)" : card.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: dm ? "#e2e8f0" : card.color }}>{card.value}</div>
              <div style={{ fontSize: 12, color: dm ? "#64748b" : "#9ca3af", fontWeight: 500 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div
            style={{
              ...css.card,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                background: "#fff7ed",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 28,
              }}
            >
              🏆
            </div>

            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Best Selling Product Today
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                }}
              >
                {dashboardData.bestSellingProduct}
              </div>
            </div>
          </div>
        {/* Recent updates */}
        <div style={css.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Recent Stock Updates</h3>
          </div>
          {recentUpdates.length === 0
            ? <p style={{ margin: 0, color: dm ? "#475569" : "#9ca3af", fontSize: 13 }}>No updates yet today.</p>
            : recentUpdates.map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${dm ? "#2d3748" : "#f3f4f6"}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{u.product}</div>
                  <div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af" }}>{u.action}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: dm ? "#64748b" : "#9ca3af" }}>{u.time}</div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>Left: {u.remaining}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Alerts */}
        <div style={css.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Active Alerts</h3>
          {alerts.length === 0
            ? <p style={{ margin: 0, color: dm ? "#475569" : "#9ca3af", fontSize: 13 }}>✅ All stock levels are healthy.</p>
            : alerts.slice(0, 6).map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 6, background: a.type === "out" ? (dm ? "#3b0f0f" : "#fef2f2") : (dm ? "#3b2600" : "#fffbeb") }}>
                <span style={{ fontSize: 16 }}>{a.type === "out" ? "🚨" : "⚠️"}</span>
                <span style={{ fontSize: 12, color: a.type === "out" ? "#ef4444" : "#f59e0b", fontWeight: 500 }}>{a.msg}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ ...css.card, marginTop: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Stock by Category</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {categories.map(cat => {
            const catProds = products.filter(p => String(p.categoryId) === String(cat.id));
            const catStock = catProds.reduce((s, p) => s + p.currentStock, 0);
            const catSold = catProds.reduce((s, p) => s + p.unitsSold, 0);
            return (
              <div key={cat.id} style={{ background: dm ? "#0f1117" : "#f9fafb", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: dm ? "#64748b" : "#9ca3af" }}>{catProds.length} products</div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af" }}>In stock</div><div style={{ fontWeight: 600, color: "#22c55e" }}>{catStock}</div></div>
                  <div><div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af" }}>Sold today</div><div style={{ fontWeight: 600, color: "#f59e0b" }}>{catSold}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prepare next day */}
      <div style={{ ...css.card, marginTop: 20, background: dm ? "#0f2038" : "#eff6ff", border: "1px solid #3b82f6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", color: "#2563eb" }}>End of Day — Prepare Next Day</h3>
            <p style={{ margin: 0, fontSize: 13, color: dm ? "#94a3b8" : "#6b7280" }}>Archive today's sales and reset all stocks to default values for tomorrow.</p>
          </div>
          <button style={{ ...css.btn("primary"), padding: "10px 20px", whiteSpace: "nowrap" }} onClick={handlePrepareNextDay}>
            🌙 Prepare Next Day
          </button>
        </div>
      </div>
    </div>
  );

  const Products = () => (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Products</h2>
        <button style={css.btn("primary")} onClick={() => setShowAddProduct(true)}>+ Add Product</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input style={{ ...css.input, maxWidth: 220 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...css.input, maxWidth: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={{ ...css.input, maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {categories.map(cat => {
        const catProds = filtered.filter(p => String(p.categoryId) === String(cat.id));
        if (!catProds.length) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>{cat.icon}</span>
              <h3 style={{ margin: 0, fontSize: 16 }}>{cat.name}</h3>
              <span style={{ fontSize: 12, color: dm ? "#64748b" : "#9ca3af", background: dm ? "#2d3748" : "#f3f4f6", padding: "2px 8px", borderRadius: 10 }}>{catProds.length}</span>
            </div>
            <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>
              <table style={css.table}>
                <thead>
                  <tr>
                    {["Product", "Default Stock", "Current Stock", "Sold Today", "Remaining", "Alert Level", "Status", "Actions"].map(h => (
                      <th key={h} style={css.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catProds.map(p => {
                    const status = getStatus(p);
                    const remaining = p.currentStock;
                    return (
                      <tr key={p.id} style={{ background: status === "out" ? (dm ? "rgba(220,38,38,0.05)" : "rgba(254,242,242,0.8)") : status === "low" ? (dm ? "rgba(217,119,6,0.05)" : "rgba(255,251,235,0.8)") : "transparent" }}>
                        <td style={css.td}><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af" }}>{p.unit}</div></td>
                        <td style={css.td}><span style={{ fontWeight: 500 }}>{p.defaultStock}</span></td>
                        <td style={css.td}><span style={{ fontWeight: 600 }}>{p.currentStock}</span></td>
                        <td style={css.td}>{p.unitsSold}</td>
                        <td style={css.td}><span style={{ fontWeight: 700, color: status === "out" ? "#ef4444" : status === "low" ? "#f59e0b" : "#22c55e", fontSize: 15 }}>{remaining}</span></td>
                        <td style={css.td}>{p.lowStockAlert}</td>
                        <td style={css.td}><span style={css.badge(status)}><span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[status].dot, display: "inline-block" }} />{STATUS_LABELS[status]}</span></td>
                        <td style={css.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={{ ...css.btn("success"), padding: "4px 10px", fontSize: 11 }} onClick={() => setShowSellModal(p)}>Sell</button>
                            <button style={{ ...css.btn("primary"), padding: "4px 10px", fontSize: 11 }} onClick={() => setShowStockModal(p)}>+Stock</button>
                            <button style={{ ...css.btn(), padding: "4px 10px", fontSize: 11 }} onClick={() => setEditProduct(p)}>Edit</button>
                            <button style={{ ...css.btn("danger"), padding: "4px 10px", fontSize: 11 }} onClick={() => handleDeleteProduct(p.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: dm ? "#475569" : "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16 }}>No products match your filters.</div>
        </div>
      )}
    </div>
  );

  const SalesEntry = () => (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>Sales Entry</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input style={{ ...css.input, maxWidth: 220 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...css.input, maxWidth: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {filtered.map(p => {
          const status = getStatus(p);
          return (
            <div key={p.id} style={{ ...css.card, borderLeft: `4px solid ${STATUS_COLORS[status].dot}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af" }}>{getCategoryName(p.categoryId)}</div>
                </div>
                <span style={css.badge(status)}>{STATUS_LABELS[status]}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16, background: dm ? "#0f1117" : "#f9fafb", borderRadius: 8, padding: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{p.defaultStock}</div>
                  <div style={{ fontSize: 10, color: dm ? "#64748b" : "#9ca3af" }}>Opening</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{p.unitsSold}</div>
                  <div style={{ fontSize: 10, color: dm ? "#64748b" : "#9ca3af" }}>Sold</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: status === "out" ? "#ef4444" : status === "low" ? "#f59e0b" : "#22c55e" }}>{p.currentStock}</div>
                  <div style={{ fontSize: 10, color: dm ? "#64748b" : "#9ca3af" }}>Remaining</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={p.currentStock === 0} style={{ ...css.btn("success"), flex: 1, opacity: p.currentStock === 0 ? 0.4 : 1 }} onClick={() => setShowSellModal(p)}>Record Sale</button>
                <button style={{ ...css.btn("primary"), flex: 1 }} onClick={() => setShowStockModal(p)}>Add Stock</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const HistoryView = () => (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>Inventory History</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input style={{ ...css.input, maxWidth: 180 }} type="date" value={historyFilter.date} onChange={e => setHistoryFilter(p => ({ ...p, date: e.target.value }))} />
        <select style={{ ...css.input, maxWidth: 160 }} value={historyFilter.category} onChange={e => setHistoryFilter(p => ({ ...p, category: e.target.value }))}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={{ ...css.input, maxWidth: 200 }} value={historyFilter.product} onChange={e => setHistoryFilter(p => ({ ...p, product: e.target.value }))}>
          <option value="all">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button style={css.btn()} onClick={() => setHistoryFilter({ date: "", category: "all", product: "all" })}>Clear</button>
      </div>

      {filteredHistory.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", padding: 60, color: dm ? "#475569" : "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16 }}>No history yet. Use "Prepare Next Day" to archive daily records.</div>
        </div>
      ) : (
        <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>
          <table style={css.table}>
            <thead>
              <tr>{["Date", "Product", "Category", "Opening Stock", "Units Sold", "Closing Stock"].map(h => <th key={h} style={css.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filteredHistory.map((h, i) => (
                <tr key={i}>
                  <td style={css.td}>{h.dateLabel}</td>
                  <td style={css.td}><span style={{ fontWeight: 500 }}>{h.productName}</span></td>
                  <td style={css.td}>{getCategoryName(h.categoryId)}</td>
                  <td style={css.td}>{h.openingStock}</td>
                  <td style={{ ...css.td, color: "#ef4444", fontWeight: 600 }}>{h.unitsSold}</td>
                  <td style={{ ...css.td, color: "#22c55e", fontWeight: 600 }}>{h.closingStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const Reports = () => {
    const data = reportData();
    const totalDefaults = products.reduce((s, p) => s + p.defaultStock, 0);
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Reports</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["daily", "weekly", "monthly"].map(t => (
              <button key={t} style={{ ...css.btn(reportType === t ? "primary" : "ghost"), textTransform: "capitalize" }} onClick={() => setReportType(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Today's summary */}
        <div style={{ ...css.card, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Today's Summary — {todayStr()}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            {[
              { label: "Total Products", value: products.length },
              { label: "Opening Stock", value: totalDefaults.toLocaleString() },
              { label: "Units Sold", value: totalSold.toLocaleString(), color: "#ef4444" },
              { label: "Remaining Stock", value: totalStock.toLocaleString(), color: "#22c55e" },
              { label: "Low Stock Items", value: lowCount, color: "#f59e0b" },
              { label: "Out of Stock", value: outCount, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} style={{ background: dm ? "#0f1117" : "#f9fafb", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color || (dm ? "#e2e8f0" : "#1a202c") }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {data ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={css.card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>🏆 Best Selling Products</h3>
              {data.best.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${dm ? "#2d3748" : "#f3f4f6"}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: ["#f59e0b", "#94a3b8", "#b45309"][i] || "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af" }}>Total sold: {p.totalSold}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={css.card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>📉 Least Selling Products</h3>
              {data.least.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${dm ? "#2d3748" : "#f3f4f6"}` }}>
                  <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: dm ? "#64748b" : "#9ca3af" }}>Sold: {p.totalSold}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ ...css.card, textAlign: "center", padding: 40, color: dm ? "#475569" : "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
            <div>No historical data yet. Use "Prepare Next Day" to generate reports.</div>
          </div>
        )}

        {/* Per-product report */}
        <div style={{ ...css.card, marginTop: 20, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${dm ? "#2d3748" : "#e5e7eb"}` }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Current Day Product Report</h3>
          </div>
          <table style={css.table}>
            <thead>
              <tr>{["Product", "Category", "Opening", "Sold", "Remaining", "%Sold", "Status"].map(h => <th key={h} style={css.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {products.map(p => {
                const pct = p.defaultStock > 0 ? Math.round((p.unitsSold / p.defaultStock) * 100) : 0;
                const status = getStatus(p);
                return (
                  <tr key={p.id}>
                    <td style={css.td}><span style={{ fontWeight: 500 }}>{p.name}</span></td>
                    <td style={css.td}>{getCategoryName(p.categoryId)}</td>
                    <td style={css.td}>{p.defaultStock}</td>
                    <td style={{ ...css.td, color: "#ef4444", fontWeight: 500 }}>{p.unitsSold}</td>
                    <td style={{ ...css.td, color: "#22c55e", fontWeight: 500 }}>{p.currentStock}</td>
                    <td style={css.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: dm ? "#2d3748" : "#e5e7eb", borderRadius: 3 }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#22c55e", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, minWidth: 28 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={css.td}><span style={css.badge(status)}>{STATUS_LABELS[status]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const AlertsView = () => (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>Stock Alerts</h2>
      {alerts.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#22c55e", marginBottom: 8 }}>All stock levels are healthy</div>
          <div style={{ color: dm ? "#64748b" : "#9ca3af" }}>No alerts at this time.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map(a => {
            const prod = products.find(p => p.id === a.id);
            return (
              <div key={a.id} style={{ ...css.card, borderLeft: `4px solid ${a.type === "out" ? "#ef4444" : "#f59e0b"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 24 }}>{a.type === "out" ? "🚨" : "⚠️"}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: a.type === "out" ? "#ef4444" : "#f59e0b" }}>{a.msg}</div>
                    {prod && <div style={{ fontSize: 12, color: dm ? "#64748b" : "#9ca3af", marginTop: 2 }}>Alert level: {prod.lowStockAlert} {prod.unit}</div>}
                  </div>
                </div>
                {prod && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...css.btn("primary"), fontSize: 12 }} onClick={() => setShowStockModal(prod)}>Add Stock</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const AuditView = () => (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>Audit Log</h2>
      {auditLog.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", padding: 60, color: dm ? "#475569" : "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div>No activity logged yet.</div>
        </div>
      ) : (
        <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>
          <table style={css.table}>
            <thead>
              <tr>{["Time", "Date", "Action", "Product", "Detail"].map(h => <th key={h} style={css.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {auditLog.map(log => (
                <tr key={log.id}>
                  <td style={{ ...css.td, fontFamily: "monospace", fontSize: 12 }}>{log.time}</td>
                  <td style={{ ...css.td, fontSize: 12 }}>{log.date}</td>
                  <td style={css.td}>
                    <span style={{ ...css.badge(log.action === "Sale" ? "out" : log.action === "Add" ? "available" : log.action === "Delete" ? "out" : "low"), fontSize: 11 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ ...css.td, fontWeight: 500 }}>{log.productName}</td>
                  <td style={{ ...css.td, color: dm ? "#94a3b8" : "#6b7280", fontSize: 13 }}>{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const SalesGraph = () => {
    const PRODUCT_COLORS = [
      "#2563eb","#16a34a","#d97706","#9333ea","#dc2626","#0891b2","#059669",
    ];

    const graphProds = graphProduct === "all" ? products : products.filter(p => p.id === parseInt(graphProduct));

    const slotTotals = HOURLY_SLOTS.map(slot => {
      const slotData = hourlySales[slot] || {};
      let total = 0;
      graphProds.forEach(p => { total += slotData[p.id] || 0; });
      return total;
    });

    const maxVal = Math.max(...slotTotals, 1);
    const chartH = 220;
    const barW = 30;
    const gap = 16;
    const leftPad = 40;
    const totalW = leftPad + HOURLY_SLOTS.length * (barW + gap);

    const peakSlot = HOURLY_SLOTS[slotTotals.indexOf(Math.max(...slotTotals))];
    const totalSoldGraph = slotTotals.reduce((a, b) => a + b, 0);
    const activeSlotsCount = slotTotals.filter(v => v > 0).length;

    const perProductData = products.map((p, idx) => ({
      ...p,
      color: PRODUCT_COLORS[idx % PRODUCT_COLORS.length],
      hourly: HOURLY_SLOTS.map(slot => hourlySales[slot]?.[p.id] || 0),
    }));

    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>Sales Graph</h2>
            <p style={{ margin: 0, color: dm ? "#64748b" : "#9ca3af", fontSize: 13 }}>Hourly sales breakdown — {todayStr()}</p>
          </div>
          <select style={{ ...css.input, maxWidth: 220 }} value={graphProduct} onChange={e => setGraphProduct(e.target.value)}>
            <option value="all">All Products (Combined)</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Sold Today", value: totalSoldGraph, icon: "📦", color: "#2563eb" },
            { label: "Peak Hour", value: totalSoldGraph > 0 ? peakSlot : "—", icon: "⏰", color: "#d97706" },
            { label: "Active Hours", value: activeSlotsCount, icon: "🕐", color: "#16a34a" },
            { label: "Avg Per Hour", value: activeSlotsCount > 0 ? Math.round(totalSoldGraph / activeSlotsCount) : 0, icon: "📊", color: "#9333ea" },
          ].map(c => (
            <div key={c.label} style={{ ...css.card, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: dm ? "#e2e8f0" : c.color }}>{c.value}</div>
                <div style={{ fontSize: 11, color: dm ? "#64748b" : "#9ca3af", fontWeight: 500 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={css.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15 }}>Units Sold by Hour</h3>
          {totalSoldGraph === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: dm ? "#475569" : "#9ca3af" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📈</div>
              <div style={{ fontSize: 14 }}>No sales recorded yet. Record a sale to see the graph update.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <svg width={Math.max(totalW, 600)} height={chartH + 60} style={{ display: "block" }}>
                {/* Y-axis grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                  const y = Math.round((1 - frac) * chartH) + 10;
                  const val = Math.round(frac * maxVal);
                  return (
                    <g key={frac}>
                      <line x1={leftPad} y1={y} x2={totalW} y2={y} stroke={dm ? "#2d3748" : "#e5e7eb"} strokeWidth="1" strokeDasharray="4,3" />
                      <text x={leftPad - 6} y={y + 4} textAnchor="end" fontSize="10" fill={dm ? "#64748b" : "#9ca3af"}>{val}</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {HOURLY_SLOTS.map((slot, i) => {
                  const total = slotTotals[i];
                  const barH = maxVal > 0 ? Math.round((total / maxVal) * chartH) : 0;
                  const x = leftPad + i * (barW + gap);
                  const y = 10 + chartH - barH;
                  const isPeak = slot === peakSlot && totalSoldGraph > 0;
                  return (
                    <g key={slot}>
                      <rect
                        x={x} y={y} width={barW} height={Math.max(barH, 0)}
                        fill={isPeak ? "#2563eb" : (dm ? "#3b4a6b" : "#93c5fd")}
                        rx="4"
                        style={{ transition: "height 0.3s" }}
                      />
                      {total > 0 && (
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill={dm ? "#94a3b8" : "#374151"}>{total}</text>
                      )}
                      <text x={x + barW / 2} y={chartH + 28} textAnchor="middle" fontSize="10" fill={dm ? "#64748b" : "#9ca3af"} transform={`rotate(-35,${x + barW / 2},${chartH + 28})`}>{slot}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Per-product hourly breakdown */}
        <div style={{ ...css.card, marginTop: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Per-Product Hourly Breakdown</h3>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            {perProductData.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                <span style={{ color: dm ? "#94a3b8" : "#6b7280" }}>{p.name}</span>
              </div>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ ...css.table, minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ ...css.th, minWidth: 160 }}>Product</th>
                  {HOURLY_SLOTS.map(s => <th key={s} style={{ ...css.th, textAlign: "center", minWidth: 44, fontSize: 10 }}>{s}</th>)}
                  <th style={{ ...css.th, textAlign: "center" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {perProductData.map(p => {
                  const rowTotal = p.hourly.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={p.id}>
                      <td style={css.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 500, fontSize: 12 }}>{p.name}</span>
                        </div>
                      </td>
                      {p.hourly.map((val, i) => (
                        <td key={i} style={{ ...css.td, textAlign: "center" }}>
                          {val > 0
                            ? <span style={{ background: p.color, color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 600 }}>{val}</span>
                            : <span style={{ color: dm ? "#374151" : "#e5e7eb", fontSize: 11 }}>—</span>}
                        </td>
                      ))}
                      <td style={{ ...css.td, textAlign: "center", fontWeight: 700, color: rowTotal > 0 ? "#2563eb" : (dm ? "#374151" : "#9ca3af") }}>{rowTotal || "—"}</td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ background: dm ? "#1a2744" : "#eff6ff" }}>
                  <td style={{ ...css.td, fontWeight: 700, fontSize: 12 }}>Total (all)</td>
                  {slotTotals.map((val, i) => (
                    <td key={i} style={{ ...css.td, textAlign: "center", fontWeight: 700, color: val > 0 ? "#2563eb" : (dm ? "#374151" : "#9ca3af"), fontSize: 12 }}>{val || "—"}</td>
                  ))}
                  <td style={{ ...css.td, textAlign: "center", fontWeight: 800, color: "#2563eb", fontSize: 14 }}>{totalSoldGraph || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sparkline per product */}
        <div style={{ ...css.card, marginTop: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Sales Trend by Product</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {perProductData.map(p => {
              const rowMax = Math.max(...p.hourly, 1);
              const rowTotal = p.hourly.reduce((a, b) => a + b, 0);
              const spW = 200, spH = 50;
              const pts = p.hourly.map((v, i) => {
                const x = Math.round((i / (p.hourly.length - 1)) * spW);
                const y = Math.round(spH - (v / rowMax) * spH);
                return `${x},${y}`;
              }).join(" ");
              return (
                <div key={p.id} style={{ background: dm ? "#0f1117" : "#f9fafb", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: rowTotal > 0 ? p.color : (dm ? "#475569" : "#9ca3af") }}>{rowTotal} sold</div>
                  </div>
                  <svg width="100%" viewBox={`0 0 ${spW} ${spH}`} style={{ display: "block" }}>
                    <polyline points={pts} fill="none" stroke={rowTotal > 0 ? p.color : (dm ? "#374151" : "#d1d5db")} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {p.hourly.map((v, i) => v > 0 && (
                      <circle key={i} cx={Math.round((i / (p.hourly.length - 1)) * spW)} cy={Math.round(spH - (v / rowMax) * spH)} r="3" fill={p.color} />
                    ))}
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <Dashboard />;
      case "products": return <Products />;
      case "sales": return <SalesEntry />;
      case "salesgraph": return <SalesGraph />;
      case "history": return <HistoryView />;
      case "reports": return <Reports />;
      case "alerts": return <AlertsView />;
      case "audit": return <AuditView />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "#f5f7fa" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🥛</div>
          <div style={{ fontWeight: 700 }}>Loading MilkShop inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={css.app}>
      {/* Sidebar */}
      <div style={css.sidebar}>
        <div style={{ padding: sidebarOpen ? "20px 16px 16px" : "20px 8px 16px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
          {sidebarOpen ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 24 }}>🥛</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>MilkShop</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Inventory Manager</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", fontSize: 22 }}>🥛</div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(item => (
            <div key={item.id} style={css.navItem(activeView === item.id)} onClick={() => setActiveView(item.id)}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: 13 }}>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px 8px", borderTop: `1px solid rgba(255,255,255,0.08)` }}>
          <div style={css.navItem(false)} onClick={() => setSidebarOpen(p => !p)}>
            <span style={{ fontSize: 16 }}>{sidebarOpen ? "◀" : "▶"}</span>
            {sidebarOpen && <span style={{ fontSize: 13 }}>Collapse</span>}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={css.main}>
        {/* Header */}
        <div style={css.header}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {NAV.find(n => n.id === activeView)?.label.replace(/\s\(\d+\)/, "")}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {alerts.length > 0 && (
              <div style={{ background: "#ef4444", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }} onClick={() => setActiveView("alerts")}>
                {alerts.length} Alert{alerts.length > 1 ? "s" : ""}
              </div>
            )}
            <button style={{ ...css.btn(), padding: "6px 14px", fontSize: 12 }} onClick={() => setDarkMode(p => !p)}>
              {dm ? "☀️ Light" : "🌙 Dark"}
            </button>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 13 }}>A</div>
          </div>
        </div>

        {renderView()}
      </div>

      {/* Modals */}
      {showSellModal && <SellModal product={showSellModal} onClose={() => setShowSellModal(null)} />}
      {showStockModal && <RestockModal product={showStockModal} onClose={() => setShowStockModal(null)} />}
      {editProduct && <EditModal product={editProduct} onClose={() => setEditProduct(null)} />}
      {showAddProduct && <AddModal />}

      {/* Toast notification */}
      {notification && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          background: notification.type === "error" ? "#dc2626" : "#16a34a",
          color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", animation: "slideIn 0.2s ease",
          maxWidth: 320,
        }}>
          {notification.type === "error" ? "❌" : "✅"} {notification.msg}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        * { box-sizing: border-box; }
        select option { background: ${dm ? "#1e2535" : "#fff"}; color: ${dm ? "#e2e8f0" : "#1a202c"}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dm ? "#374151" : "#d1d5db"}; border-radius: 3px; }
      `}</style>
    </div>
  );
}