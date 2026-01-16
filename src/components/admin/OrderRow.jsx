// OrderRow.jsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { downloadAusPostCSV } from "../../utils/exportToAusPost";
import { styles } from "./OrderManagerStyles";
import {
  ExternalLink,
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  Package,
  Phone,
  Mail,
  User,
  Zap,
  Download,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";

export function OrderRow({ order, onUpdate, showToast, promptConfirm }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(order.notes || "");
  const [formData, setFormData] = useState({
    status: order.status,
    tracking: order.tracking_number || "",
    address: { ...order.shipping_address },
  });

  const handleSingleExport = (e) => {
    e.stopPropagation();
    downloadAusPostCSV([order]);
    showToast(`Exported Order #${order.id.slice(0, 8)}`);
  };

  const handleSaveNote = async () => {
    const { error } = await supabase
      .from("orders")
      .update({ notes: noteText })
      .eq("id", order.id);

    if (error) showToast("Failed to save note");
    else {
      showToast("Note saved!");
      onUpdate();
    }
  };

  const sendStatusEmail = async (tracking, statusType) => {
    try {
      const rawItems =
        order.order_items && order.order_items.length > 0
          ? order.order_items
          : order.items;
      const emailItems = rawItems.map((item) => {
        let name =
          item.product_name_snapshot ||
          item.description ||
          item.name ||
          "Unknown Product";
        let size = "";
        if (item.variants && item.variants.products) {
          name = item.variants.products.name;
          size = item.variants.size_label;
        }
        return { name, quantity: item.quantity, size };
      });

      const { error } = await supabase.functions.invoke("send-order-update", {
        body: {
          orderId: order.id,
          email: order.customer_email,
          name: order.customer_name,
          trackingNumber: tracking || "N/A",
          items: emailItems,
          address: order.shipping_address,
          status: statusType,
        },
      });

      if (error) throw error;
      showToast("Email notification sent!");
    } catch (err) {
      console.error(err);
      showToast("Error sending email");
    }
  };

  const handleSave = async () => {
    const newStatus = formData.status;
    const isNotifyStatus = ["label_created", "shipped", "delivered"].includes(
      newStatus
    );
    const hasStatusChanged = newStatus !== order.status;

    if (isNotifyStatus && hasStatusChanged) {
      promptConfirm(
        `Confirm ${newStatus}`,
        `Mark as ${newStatus}? This sends an email.`,
        async () => await executeUpdate(true, newStatus)
      );
    } else {
      await executeUpdate(false, newStatus);
    }
  };

  const executeUpdate = async (shouldSendEmail, statusType) => {
    const { error } = await supabase
      .from("orders")
      .update({
        status: formData.status,
        tracking_number: formData.tracking,
        shipping_address: formData.address,
      })
      .eq("id", order.id);

    if (error) alert(error.message);
    else {
      showToast("Order updated");
      if (shouldSendEmail) await sendStatusEmail(formData.tracking, statusType);
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleQuickStatus = (newStatus) => {
    promptConfirm("Update Status", `Mark as ${newStatus}?`, async () => {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);
      if (!error) {
        showToast(`Updated to ${newStatus}`);
        await sendStatusEmail(order.tracking_number, newStatus);
        onUpdate();
      }
    });
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case "pending":
        return { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" };
      case "label_created":
        return { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff" };
      case "shipped":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#dbeafe" };
      case "delivered":
        return { bg: "#f0fdf4", color: "#15803d", border: "#dcfce7" };
      case "cancelled":
        return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
      default:
        return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
    }
  };

  const sStyle = getStatusStyle(order.status);
  const isExpress = order.shipping_method === "Express";
  const hasNote = order.notes && order.notes.trim().length > 0;

  return (
    <div style={styles.orderRow}>
      <div
        style={styles.rowHeader}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div style={styles.colInfo}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={styles.primaryText}>
              {order.customer_name || "Guest"}
            </div>
            {hasNote && (
              <div style={styles.noteBubble} title="Has admin note">
                <MessageCircle size={14} color="#2563eb" />
                <span style={styles.noteText}>Note</span>
              </div>
            )}
          </div>
          <div style={styles.metaText}>
            #{order.id.slice(0, 8)} •{" "}
            {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
        <div style={styles.colStatus}>
          <span
            style={{
              ...styles.badge,
              backgroundColor: sStyle.bg,
              color: sStyle.color,
              borderColor: sStyle.border,
            }}
          >
            {order.status === "label_created" ? "Label Created" : order.status}
          </span>
          <div
            style={{
              marginTop: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              fontSize: "0.75rem",
              color: "#64748b",
            }}
          >
            {isExpress ? (
              <>
                <Zap size={12} fill="#f59e0b" color="#d97706" />{" "}
                <span style={{ color: "#d97706" }}>Express</span>
              </>
            ) : (
              <>
                <Truck size={12} /> <span>Standard</span>
              </>
            )}
          </div>
        </div>
        <div style={styles.colTotal}>${order.total_amount}</div>
        <button
          onClick={handleSingleExport}
          style={styles.actionIconBtn}
          title="Export CSV"
        >
          <Download size={18} />
        </button>
        <button style={styles.iconBtn}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div style={styles.expandedPanel}>
          <div style={styles.sectionTitle}>
            <User size={14} /> Customer Details
          </div>
          <div style={styles.customerGrid}>
            <div style={styles.customerItem}>
              <Mail size={14} color="#64748b" /> {order.customer_email}
            </div>
            <div style={styles.customerItem}>
              <Phone size={14} color="#64748b" />{" "}
              {order.shipping_address?.phone || "N/A"}
            </div>
            <div style={{ ...styles.customerItem, gridColumn: "span 2" }}>
              <MapPin size={14} color="#64748b" />{" "}
              {order.shipping_address
                ? `${order.shipping_address.line1}, ${order.shipping_address.city} ${order.shipping_address.postal_code}`
                : "N/A"}
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <div style={styles.sectionTitle}>
              <MessageCircle size={14} /> Admin Notes
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add private notes..."
                style={styles.noteInput}
                rows={2}
              />
              <button onClick={handleSaveNote} style={styles.saveNoteBtn}>
                Save
              </button>
            </div>
          </div>

          <div
            style={{ margin: "20px 0", borderTop: "1px solid #e2e8f0" }}
          ></div>

          <div style={styles.panelGrid}>
            <div style={{ gridColumn: "span 2" }}>
              <div style={styles.sectionTitle}>
                <Package size={14} /> Items
              </div>
              <div style={styles.itemsTable}>
                <div style={styles.tableHeader}>
                  <span>Qty</span>
                  <span style={{ flex: 1 }}>Product</span>
                  <span style={{ width: 80, textAlign: "right" }}>Price</span>
                </div>
                {(order.order_items && order.order_items.length > 0
                  ? order.order_items
                  : order.items
                ).map((item, i) => (
                  <div key={i} style={styles.itemRow}>
                    <span style={styles.itemQty}>{item.quantity}x</span>
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>
                        {item.product_name_snapshot ||
                          item.description ||
                          "Product"}
                      </span>
                      {item.variants && (
                        <span style={styles.variantLabel}>
                          {item.variants.size_label}
                        </span>
                      )}
                    </div>
                    <span style={styles.itemPrice}>
                      $
                      {(item.price_at_purchase || item.unit_price || 0).toFixed(
                        2
                      )}
                    </span>
                  </div>
                ))}
                <div style={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>${order.shipping_cost || "0.00"}</span>
                </div>
              </div>
            </div>

            <div style={styles.detailCol}>
              <div style={styles.sectionTitle}>
                <Edit2 size={14} /> Manage
              </div>
              {isEditing ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="pending">Pending</option>
                    <option value="label_created">Label Created</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input
                    placeholder="Tracking #"
                    value={formData.tracking}
                    onChange={(e) =>
                      setFormData({ ...formData, tracking: e.target.value })
                    }
                    style={styles.input}
                  />
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={handleSave} style={styles.saveBtn}>
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    height: "100%",
                  }}
                >
                  <div style={styles.trackingBox}>
                    {order.tracking_number ? (
                      <a
                        href={`https://auspost.com.au/mypost/track/#/details/${order.tracking_number}`}
                        target="_blank"
                        style={styles.trackingLink}
                      >
                        {order.tracking_number} <ExternalLink size={12} />
                      </a>
                    ) : (
                      "No Tracking"
                    )}
                  </div>
                  <div style={{ marginTop: "auto" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleQuickStatus("label_created")}
                          style={styles.actionBtn}
                        >
                          Mark Label Created
                        </button>
                      )}
                      {(order.status === "pending" ||
                        order.status === "label_created") && (
                        <button
                          onClick={() => handleQuickStatus("shipped")}
                          style={styles.actionBtn}
                        >
                          Mark Shipped
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={styles.secondaryBtn}
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConfirmationModal({ config, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          {config.isDestructive && <AlertTriangle size={20} color="#ef4444" />}
          <h3 style={styles.modalTitle}>{config.title}</h3>
        </div>
        <p style={styles.modalMessage}>{config.message}</p>
        <div style={styles.modalActions}>
          <button onClick={onClose} style={styles.modalCancel}>
            Cancel
          </button>
          <button
            onClick={config.onConfirm}
            style={
              config.isDestructive ? styles.modalDelete : styles.modalConfirm
            }
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
