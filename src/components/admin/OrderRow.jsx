import { useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { styles } from "./OrderManagerStyles";
import {
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
  Truck,
  Package,
  User,
  Zap,
  MessageCircle,
  Tag,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  XCircle,
  Layers,
} from "lucide-react";

export function OrderRow({ order, onUpdate, showToast, promptConfirm }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(order.notes || "");
  const [emailMode, setEmailMode] = useState(false);
  const [customEmailText, setCustomEmailText] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [quickTracking, setQuickTracking] = useState(
    order.tracking_number || "",
  );
  const [selectedStatus, setSelectedStatus] = useState("label_created");

  const [formData, setFormData] = useState({
    status: order.status,
    tracking: order.tracking_number || "",
    name: order.customer_name || "",
    email: order.customer_email || "",
    phone: order.shipping_address?.phone || "",
    line1: order.shipping_address?.line1 || "",
    line2: order.shipping_address?.line2 || "",
    city: order.shipping_address?.city || "",
    state: order.shipping_address?.state || "",
    postal_code: order.shipping_address?.postal_code || "",
    country: order.shipping_address?.country || "AU",
    shipping_method: order.shipping_method || "standard",
    notes: order.notes || "",
  });

  // Helper to extract items safely whether fused or standard
  const getDisplayItems = (targetOrder) => {
    try {
      if (targetOrder.order_items && targetOrder.order_items.length > 0) {
        return targetOrder.order_items;
      } else if (targetOrder.items) {
        return typeof targetOrder.items === "string"
          ? JSON.parse(targetOrder.items)
          : targetOrder.items;
      }
      return [];
    } catch (e) {
      console.error("Error parsing order items:", e);
      return [];
    }
  };

  const displayItems = useMemo(() => getDisplayItems(order), [order]);

  const formatAUSDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-AU", {
      timeZone: "Australia/Melbourne",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const sendStatusEmail = async (tracking, statusType) => {
    try {
      // Loop through single or fused orders to send combined email notifications
      const ordersToEmail = order.isFused ? order.orders : [order];

      const emailItems = [];
      ordersToEmail.forEach((subOrder) => {
        const items = getDisplayItems(subOrder);
        items.forEach((item) => {
          let name = item.product_name_snapshot || item.name || "Product";
          let size = "";
          if (item.variants && item.variants.products) {
            name = item.variants.products.name;
            size = item.variants.size_label;
          } else if (item.variant) {
            size =
              typeof item.variant === "string"
                ? item.variant
                : item.variant.size_label || "";
          }
          emailItems.push({ name, quantity: item.quantity, size });
        });
      });

      // Construct a dynamic ID string for the email (e.g. "ABC12345 & XYZ98765")
      const displayId = order.isFused
        ? order.orders.map((o) => o.id.slice(0, 8)).join(" & ")
        : order.id.slice(0, 8);

      const { error } = await supabase.functions.invoke("send-order-update", {
        body: {
          orderId: displayId,
          email: formData.email,
          name: formData.name,
          trackingNumber: tracking || "N/A",
          items: emailItems,
          address: {
            line1: formData.line1,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
          },
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

  const handleApprovePayment = async () => {
    promptConfirm(
      "Confirm Payment",
      "Mark as Paid? This will move it to the Paid tab AND email the customer.",
      async () => {
        const idsToUpdate = order.isFused ? order.real_ids : [order.id];
        const { error } = await supabase
          .from("orders")
          .update({ status: "paid" })
          .in("id", idsToUpdate);

        if (!error) {
          showToast("Payment Approved");
          await sendStatusEmail(quickTracking, "paid");
          onUpdate();
        }
      },
    );
  };

  const handleRejectPayment = async () => {
    promptConfirm(
      "Reject",
      "Cancel this order? This cannot be undone.",
      async () => {
        const idsToUpdate = order.isFused ? order.real_ids : [order.id];
        const { error } = await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .in("id", idsToUpdate);

        if (!error) {
          showToast("Order Cancelled");
          onUpdate();
        }
      },
      true,
    );
  };

  const handleSaveNote = async () => {
    const idsToUpdate = order.isFused ? order.real_ids : [order.id];
    const { error } = await supabase
      .from("orders")
      .update({ notes: noteText })
      .in("id", idsToUpdate);

    if (error) showToast("Failed to save note");
    else {
      showToast("Note saved!");
      setFormData({ ...formData, notes: noteText });
      onUpdate();
    }
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus) return;

    let promptMsg = `Mark as ${selectedStatus.replace("_", " ")}?`;
    if (quickTracking) promptMsg += ` (Tracking: ${quickTracking})`;
    if (order.isFused)
      promptMsg += `\n🚨 This will update ALL fused orders simultaneously!`;

    promptConfirm("Update Status", promptMsg, async () => {
      const idsToUpdate = order.isFused ? order.real_ids : [order.id];
      const { error } = await supabase
        .from("orders")
        .update({
          status: selectedStatus,
          tracking_number: quickTracking,
        })
        .in("id", idsToUpdate);

      if (!error) {
        showToast(`Updated to ${selectedStatus}`);
        if (
          ["paid", "label_created", "shipped", "delivered"].includes(
            selectedStatus,
          )
        ) {
          await sendStatusEmail(quickTracking, selectedStatus);
        }
        onUpdate();
      }
    });
  };

  const handleSaveEdit = async () => {
    try {
      const idsToUpdate = order.isFused ? order.real_ids : [order.id];
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: formData.name,
          customer_email: formData.email,
          shipping_method: formData.shipping_method,
          notes: formData.notes,
          shipping_address: {
            phone: formData.phone,
            line1: formData.line1,
            line2: formData.line2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
          },
        })
        .in("id", idsToUpdate);

      if (error) throw error;

      showToast("Order details updated successfully!");
      setNoteText(formData.notes);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error(err);
      showToast("Error updating order details.");
    }
  };

  const handleCancelOrder = async () => {
    promptConfirm(
      "Cancel Order",
      "Are you sure you want to cancel? It will be moved to the Canceled tab instead of being permanently deleted.",
      async () => {
        try {
          const idsToUpdate = order.isFused ? order.real_ids : [order.id];
          const { error } = await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .in("id", idsToUpdate);

          if (error) throw error;
          showToast("Order canceled successfully!");
          onUpdate();
        } catch (err) {
          showToast("Failed to cancel order.");
        }
      },
      true,
    );
  };

  const handleHardDelete = async () => {
    promptConfirm(
      "Delete Permanently",
      "Are you absolutely sure? This will permanently wipe the order(s) and payment proof(s) from the database. This CANNOT be undone.",
      async () => {
        try {
          const ordersToDelete = order.isFused ? order.orders : [order];

          for (const o of ordersToDelete) {
            // 1. Wipe image from storage if it exists
            if (o.receipt_url) {
              const urlParts = o.receipt_url.split("payment-proofs/");
              if (urlParts.length > 1) {
                const fileName = urlParts[1].split("?")[0];
                const { error: storageError } = await supabase.storage
                  .from("payment-proofs")
                  .remove([fileName]);
                if (storageError)
                  console.error("Failed to delete image:", storageError);
              }
            }
            // 2. Wipe row from database
            await supabase.from("orders").delete().eq("id", o.id);
          }

          showToast("Order permanently deleted.");
          onUpdate();
        } catch (err) {
          console.error("Error deleting order:", err);
          showToast("Failed to delete order.");
        }
      },
      true,
    );
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case "pending":
      case "payment_reported":
        return {
          bg: "#fff7ed",
          color: "#c2410c",
          border: "#ffedd5",
          label: "Verify Payment",
        };
      case "pending_contact":
      case "pending_payment":
        return {
          bg: "#fefce8",
          color: "#854d0e",
          border: "#fef9c3",
          label: "Unpaid",
        };
      case "paid":
      case "processing":
        return {
          bg: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          label: "Paid",
        };
      case "label_created":
        return {
          bg: "#f3e8ff",
          color: "#7e22ce",
          border: "#e9d5ff",
          label: "Label Created",
        };
      case "shipped":
        return {
          bg: "#eff6ff",
          color: "#1d4ed8",
          border: "#dbeafe",
          label: "Shipped",
        };
      case "delivered":
        return {
          bg: "#f0fdf4",
          color: "#15803d",
          border: "#dcfce7",
          label: "Delivered",
        };
      case "cancelled":
        return {
          bg: "#fef2f2",
          color: "#b91c1c",
          border: "#fecaca",
          label: "Cancelled",
        };
      default:
        return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: s };
    }
  };

  const sStyle = getStatusStyle(order.status);
  const isExpress = order.shipping_method?.toLowerCase() === "express";

  // Sub-component to render the demarcated items for Fused Orders
  const renderItemBlock = (subOrder) => {
    const subItems = getDisplayItems(subOrder);
    return (
      <div
        key={subOrder.id}
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#f8fafc",
          borderRadius: "8px",
          border: "1px dashed #cbd5e1",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            fontSize: "0.8rem",
            color: "#64748b",
            fontWeight: "bold",
          }}
        >
          <span>Order #{subOrder.id.slice(0, 8)}</span>
          <span>{formatAUSDate(subOrder.created_at)}</span>
        </div>
        {subItems.map((item, i) => {
          let sizeText =
            item.variants?.size_label ||
            (typeof item.variant === "string"
              ? item.variant
              : item.variant?.size_label) ||
            "";
          const price = item.price_at_purchase || item.price || 0;
          const isItemPreorder =
            item.is_preorder === true || item.is_preorder === "true";

          return (
            <div key={i} style={styles.itemRow}>
              <span style={styles.itemQty}>{item.quantity}x</span>
              <div style={styles.itemInfo}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={styles.itemName}>
                    {item.product_name_snapshot || item.name || "Product"}
                  </span>
                  {isItemPreorder && (
                    <span
                      style={{
                        background: "#f3e8ff",
                        color: "#7e22ce",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                      }}
                    >
                      PRE-ORDER
                    </span>
                  )}
                </div>
                {sizeText && (
                  <span
                    style={{
                      ...styles.variantLabel,
                      color: isItemPreorder ? "#7e22ce" : "#64748b",
                      fontWeight: isItemPreorder ? "600" : "normal",
                    }}
                  >
                    {sizeText}
                  </span>
                )}
              </div>
              <span style={styles.itemPrice}>${price.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div style={styles.orderRow}>
        <div
          style={{
            ...styles.rowHeader,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
          role="button"
          tabIndex={0}
          onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        >
          <div style={styles.colInfo}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <div style={styles.primaryText}>
                {order.customer_name || "Guest"}
              </div>

              {order.isFused && (
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Layers size={12} /> {order.orders.length} Merged Orders
                </span>
              )}

              {order.receipt_url && (
                <ImageIcon
                  size={14}
                  color="#d97706"
                  title="Has Payment Receipt"
                />
              )}
              {order.notes && (
                <MessageCircle size={14} color="#3b82f6" title="Has Notes" />
              )}
              {order.discount_code && (
                <span
                  style={{
                    background: "#dcfce7",
                    color: "#166534",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px solid #bbf7d0",
                  }}
                  title="Discount Code Used"
                >
                  <Tag size={10} /> {order.discount_code.toUpperCase()}
                </span>
              )}
            </div>
            <div style={styles.metaText}>
              #{order.id.slice(0, 8)} • {formatAUSDate(order.created_at)}
              {isExpress ? (
                <span
                  style={{
                    marginLeft: "8px",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <Zap size={10} /> EXPRESS
                </span>
              ) : (
                <span
                  style={{
                    marginLeft: "8px",
                    background: "#fef08a",
                    color: "#a16207",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <Truck size={10} /> STANDARD
                </span>
              )}
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
              {sStyle.label}
            </span>
          </div>
          <div style={styles.colTotal}>
            ${Number(order.total_amount || 0).toFixed(2)}
          </div>

          <button
            style={{ ...styles.iconBtn, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isEditing) setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {isExpanded && (
          <div style={styles.expandedPanel}>
            {isEditing ? (
              <div
                style={{
                  padding: "10px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    ...styles.sectionTitle,
                    color: "#334155",
                    marginBottom: "15px",
                  }}
                >
                  <Edit2 size={16} /> Edit Order Details
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      Customer Name
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        width: "100%",
                        background: "white",
                      }}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      Email
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        width: "100%",
                        background: "white",
                      }}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      Phone
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        width: "100%",
                        background: "white",
                      }}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      Shipping Method
                    </label>
                    <select
                      style={{
                        ...styles.input,
                        width: "100%",
                        background: "white",
                      }}
                      value={formData.shipping_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_method: e.target.value,
                        })
                      }
                    >
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      Address Line 1
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        width: "100%",
                        background: "white",
                      }}
                      value={formData.line1}
                      onChange={(e) =>
                        setFormData({ ...formData, line1: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      Address Line 2
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        width: "100%",
                        background: "white",
                      }}
                      value={formData.line2}
                      onChange={(e) =>
                        setFormData({ ...formData, line2: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#64748b",
                      }}
                    >
                      City
                    </label>
                    <input
                      style={{
                        ...styles.input,
                        width: "100%",
                        background: "white",
                      }}
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          color: "#64748b",
                        }}
                      >
                        State
                      </label>
                      <input
                        style={{
                          ...styles.input,
                          width: "100%",
                          background: "white",
                        }}
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          color: "#64748b",
                        }}
                      >
                        Postcode
                      </label>
                      <input
                        style={{
                          ...styles.input,
                          width: "100%",
                          background: "white",
                        }}
                        value={formData.postal_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            postal_code: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      color: "#64748b",
                    }}
                  >
                    Internal Notes
                  </label>
                  <textarea
                    style={{
                      ...styles.input,
                      width: "100%",
                      background: "white",
                      minHeight: "60px",
                    }}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ ...styles.secondaryBtn, background: "white" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      ...styles.actionBtn,
                      background: "#16a34a",
                      color: "white",
                      borderColor: "#16a34a",
                      display: "flex",
                      gap: "5px",
                      alignItems: "center",
                    }}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                {(order.status === "pending" ||
                  order.status === "payment_reported" ||
                  order.status === "pending_contact") && (
                  <div
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "20px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        color: "#9a3412",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AlertTriangle size={18} /> Review Payment Proof
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      {order.receipt_url ? (
                        <a
                          href={order.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "white",
                            padding: "10px 16px",
                            borderRadius: "6px",
                            border: "1px solid #fdba74",
                            color: "#c2410c",
                            fontWeight: "bold",
                            textDecoration: "none",
                          }}
                        >
                          <ImageIcon size={18} /> View Payment Screenshot
                        </a>
                      ) : (
                        <span
                          style={{
                            color: "#ef4444",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <XCircle size={18} /> No Screenshot Sent
                        </span>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginLeft: "auto",
                        }}
                      >
                        <button
                          onClick={handleRejectPayment}
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Cancel Order
                        </button>
                        <button
                          onClick={handleApprovePayment}
                          style={{
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <CheckCircle size={16} /> Approve & Move to Paid
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div style={styles.panelGrid}>
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={styles.sectionTitle}>
                      <Package size={14} /> Items
                    </div>
                    <div style={styles.itemsTable}>
                      {order.isFused
                        ? order.orders.map((sub) => renderItemBlock(sub))
                        : renderItemBlock(order)}
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        background: "#f1f5f9",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          color: "#475569",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Truck size={14} /> Shipping Paid
                      </span>
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "bold",
                          color:
                            Number(order.shipping_cost) > 0
                              ? "#0f172a"
                              : "#16a34a",
                        }}
                      >
                        {Number(order.shipping_cost) > 0
                          ? `$${Number(order.shipping_cost).toFixed(2)}`
                          : "Free"}
                      </span>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <div style={styles.sectionTitle}>
                        <MessageCircle size={14} /> Private Notes
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Details about payment, customer..."
                          style={styles.noteInput}
                          rows={2}
                        />
                        <button
                          onClick={handleSaveNote}
                          style={styles.saveNoteBtn}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={styles.detailCol}>
                    <div style={styles.sectionTitle}>
                      <User size={14} /> Customer Details
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#334155",
                        lineHeight: "1.6",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>
                        {order.customer_name}
                      </div>
                      <div>{order.customer_email}</div>
                      <div>{order.shipping_address?.phone}</div>

                      {order.discount_code && (
                        <div style={{ marginTop: "4px" }}>
                          <span
                            style={{ fontWeight: "bold", color: "#64748b" }}
                          >
                            Promo Code:
                          </span>
                          <span
                            style={{
                              marginLeft: "6px",
                              color: "#166534",
                              fontWeight: "bold",
                            }}
                          >
                            {order.discount_code.toUpperCase()}
                          </span>
                        </div>
                      )}

                      <hr
                        style={{
                          margin: "10px 0",
                          border: "0",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      />
                      <div>
                        <span style={{ fontWeight: "bold" }}>Shipping:</span>{" "}
                        <span
                          style={{
                            textTransform: "capitalize",
                            color: isExpress ? "#b91c1c" : "#a16207",
                            fontWeight: "bold",
                          }}
                        >
                          {order.shipping_method || "Standard"}
                        </span>
                        {order.isFused && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.7rem",
                              color: "#64748b",
                            }}
                          >
                            *Merged row uses highest tier
                          </span>
                        )}
                      </div>
                      <div>{order.shipping_address?.line1}</div>
                      <div>
                        {order.shipping_address?.city},{" "}
                        {order.shipping_address?.state}{" "}
                        {order.shipping_address?.postal_code}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        background: "#f8fafc",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: "#64748b",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Tracking Number
                        </label>
                        <input
                          placeholder="Paste AusPost tracking here..."
                          value={quickTracking}
                          onChange={(e) => setQuickTracking(e.target.value)}
                          style={{
                            ...styles.input,
                            width: "100%",
                            background: "white",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: "#64748b",
                            display: "block",
                            marginBottom: "4px",
                          }}
                        >
                          Update Status
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          style={{
                            ...styles.input,
                            width: "100%",
                            background: "white",
                          }}
                        >
                          <option value="paid">Paid (Processing)</option>
                          <option value="label_created">Label Created</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                      <button
                        onClick={handleUpdateStatus}
                        style={{
                          ...styles.actionBtn,
                          background: "#0f172a",
                          color: "white",
                          borderColor: "#0f172a",
                          width: "100%",
                          padding: "10px",
                          marginTop: "5px",
                        }}
                      >
                        Update & Email Customer
                      </button>

                      <button
                        onClick={() => setIsEditing(true)}
                        style={{
                          ...styles.secondaryBtn,
                          width: "100%",
                          marginTop: "10px",
                        }}
                      >
                        <Edit2 size={14} /> Edit Full Order Details
                      </button>

                      {order.status === "cancelled" ? (
                        <button
                          onClick={handleHardDelete}
                          style={{
                            background: "#7f1d1d",
                            color: "white",
                            border: "none",
                            width: "100%",
                            padding: "10px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            marginTop: "5px",
                          }}
                        >
                          <Trash2 size={16} /> Delete Permanently
                        </button>
                      ) : (
                        <button
                          onClick={handleCancelOrder}
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca",
                            width: "100%",
                            padding: "10px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            marginTop: "5px",
                          }}
                        >
                          <XCircle size={16} /> Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
