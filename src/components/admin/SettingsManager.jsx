import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { styles } from "./OrderManagerStyles";
import { OrderRow } from "./OrderRow";
import { CheckCircle, AlertTriangle, X, Trash2 } from "lucide-react";

export default function SettingsManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // --- NEW: State for the custom delete modal ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    orderId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

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

  // 1. User clicks delete on the row -> Opens Modal
  const requestDelete = (orderId) => {
    setDeleteModal({ isOpen: true, orderId });
  };

  // 2. User clicks "Confirm" inside the Modal -> Performs Action
  const confirmDelete = async () => {
    if (!deleteModal.orderId) return;

    setIsDeleting(true);
    const orderId = deleteModal.orderId;

    // Supabase Delete
    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      console.error("Error deleting order:", error);
      showToast("Failed to delete entry");
    } else {
      // Optimistic Update
      setOrders((prevOrders) => prevOrders.filter((o) => o.id !== orderId));
      showToast("Entry deleted successfully");
    }

    // Cleanup
    setIsDeleting(false);
    setDeleteModal({ isOpen: false, orderId: null });
  };

  // 3. User clicks Cancel
  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, orderId: null });
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Kept for other non-destructive prompts if you have them,
  // but delete now uses the custom modal.
  const promptConfirm = (title, message, onConfirm) => {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  };

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
              // Pass the function that OPENS the modal
              onDelete={() => requestDelete(order.id)}
            />
          ))
        )}
      </div>

      {notification && (
        <div style={styles.toast}>
          <CheckCircle size={16} /> {notification}
        </div>
      )}

      {/* --- CUSTOM DELETE MODAL --- */}
      {deleteModal.isOpen && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.container}>
            <div style={modalStyles.iconWrapper}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <h3 style={modalStyles.title}>Delete Abandoned Checkout?</h3>
            <p style={modalStyles.message}>
              Are you sure you want to permanently remove this entry? This
              action cannot be undone and the data will be lost.
            </p>
            <div style={modalStyles.buttonGroup}>
              <button
                onClick={cancelDelete}
                style={modalStyles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={modalStyles.deleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Internal Styles for the Modal (No external CSS needed) ---
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dimmed background
    backdropFilter: "blur(2px)", // Subtle blur effect
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "fadeIn 0.2s ease-out",
  },
  container: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "400px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconWrapper: {
    backgroundColor: "#fee2e2", // Light red bg
    borderRadius: "50%",
    padding: "12px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#111827",
  },
  message: {
    margin: "0 0 24px 0",
    fontSize: "0.875rem",
    color: "#6b7280",
    lineHeight: "1.5",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: "white",
    color: "#374151",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  deleteButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#dc2626", // Red 600
    color: "white",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  },
};
