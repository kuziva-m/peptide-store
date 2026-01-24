import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { styles } from "./OrderManagerStyles";
import { OrderRow } from "./OrderRow";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function SettingsManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `*, order_items (quantity, price_at_purchase, product_name_snapshot, variants (size_label, products (name, image_url)))`,
      )
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data || []);
    setLoading(false);
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const promptConfirm = (title, message, onConfirm, isDestructive = false) => {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  };

  // Filter ONLY Abandoned Orders (Ghosts)
  const abandonedOrders = useMemo(() => {
    return orders.filter(
      (order) => order.status === "pending" && !order.customer_name,
    );
  }, [orders]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertTriangle size={20} color="#d97706" /> Abandoned Checkouts
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "5px" }}>
          These are initiated checkouts that were not completed or failed.
        </p>
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : abandonedOrders.length === 0 ? (
          <div style={styles.emptyState}>No abandoned checkouts found.</div>
        ) : (
          abandonedOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onUpdate={fetchOrders}
              showToast={showToast}
              promptConfirm={promptConfirm}
            />
          ))
        )}
      </div>

      {notification && (
        <div style={styles.toast}>
          <CheckCircle size={16} /> {notification}
        </div>
      )}
    </div>
  );
}
