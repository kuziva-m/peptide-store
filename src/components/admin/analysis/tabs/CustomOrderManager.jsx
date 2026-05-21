import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Search,
  Plus,
  Trash2,
  Save,
  User,
  ShoppingCart,
  Tag,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function CustomOrderManager() {
  // --- DATA STATES ---
  const [products, setProducts] = useState([]);
  const [pastCustomers, setPastCustomers] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- ORDER STATES ---
  const [cart, setCart] = useState([]);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");

  // --- CUSTOMER STATES ---
  const [searchEmail, setSearchEmail] = useState("");
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Australia",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("active", true);
      setProducts(prodData || []);

      // 2. Fetch Discounts
      const { data: discData } = await supabase
        .from("discounts")
        .select("*")
        .eq("active", true);
      setDiscounts(discData || []);

      // 3. Fetch past orders to extract unique customers for the autocomplete
      const { data: ordData } = await supabase
        .from("orders")
        .select("customer_name, customer_email, shipping_address")
        .order("created_at", { ascending: false })
        .limit(500);

      if (ordData) {
        // Deduplicate customers by email
        const unique = [];
        const emails = new Set();
        for (const order of ordData) {
          if (!emails.has(order.customer_email)) {
            emails.add(order.customer_email);
            unique.push(order);
          }
        }
        setPastCustomers(unique);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
    setLoading(false);
  };

  // --- CART LOGIC ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // --- DISCOUNT LOGIC ---
  const applyDiscount = () => {
    setDiscountError("");
    if (!discountInput.trim()) {
      setAppliedDiscount(null);
      return;
    }
    const found = discounts.find(
      (d) => d.code.toLowerCase() === discountInput.trim().toLowerCase(),
    );
    if (found) {
      setAppliedDiscount(found);
    } else {
      setAppliedDiscount(null);
      setDiscountError("Invalid or inactive discount code.");
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
  };

  // --- CUSTOMER LOGIC ---
  const handleCustomerSelect = (email) => {
    const cust = pastCustomers.find((c) => c.customer_email === email);
    if (cust) {
      let address = {};
      try {
        address =
          typeof cust.shipping_address === "string"
            ? JSON.parse(cust.shipping_address)
            : cust.shipping_address || {};
      } catch (e) {}

      setCustomerForm({
        name: cust.customer_name || "",
        email: cust.customer_email || "",
        phone: address.phone || "",
        line1: address.line1 || address.address || "",
        city: address.city || "",
        state: address.state || "",
        postal_code: address.postal_code || address.postcode || "",
        country: address.country || "Australia",
      });
    }
  };

  // --- MATH CALCS ---
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      discountAmount = subtotal * (appliedDiscount.value / 100);
    } else {
      discountAmount = appliedDiscount.value;
    }
  }

  let shippingCost = shippingMethod === "express" ? 15.0 : 10.0;
  if (appliedDiscount?.free_shipping) {
    shippingCost = 0;
  }

  const total = Math.max(0, subtotal - discountAmount) + shippingCost;

  // --- SUBMISSION LOGIC ---
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!customerForm.name || !customerForm.email || !customerForm.line1) {
      return alert("Please fill out all required customer details.");
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image_url,
      }));

      const shippingAddress = {
        line1: customerForm.line1,
        city: customerForm.city,
        state: customerForm.state,
        postal_code: customerForm.postal_code,
        country: customerForm.country,
        phone: customerForm.phone,
      };

      const orderPayload = {
        customer_name: customerForm.name,
        customer_email: customerForm.email,
        shipping_address: shippingAddress,
        items: JSON.stringify(orderItems), // Store as JSON string or jsonb depending on your DB
        subtotal: subtotal,
        discount_amount: discountAmount,
        shipping_cost: shippingCost,
        total_amount: total,
        status: "processing", // Triggers regular fulfillment flow
        payment_status: "paid", // Assumes custom orders are paid manually (invoice, cash, etc)
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderPayload])
        .select();

      if (error) throw error;

      // OPTIONAL: Trigger automated confirmation email edge function here
      // await supabase.functions.invoke("send-email", { body: { orderId: data[0].id, type: "confirmation" }});

      alert("Order created successfully!");

      // Reset Form
      setCart([]);
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        line1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Australia",
      });
      removeDiscount();
    } catch (err) {
      console.error(err);
      alert("Failed to create order: " + err.message);
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Loading system...
      </div>
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        gap: "24px",
        alignItems: "start",
      }}
    >
      {/* LEFT COLUMN: Configuration */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* CUSTOMER SECTION */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <User size={20} /> Customer Details
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={styles.label}>Select Past Customer (Auto-fill)</label>
            <select
              style={styles.input}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                -- Select existing or type new below --
              </option>
              {pastCustomers.map((c, i) => (
                <option key={i} value={c.customer_email}>
                  {c.customer_name} ({c.customer_email})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <label style={styles.label}>Full Name *</label>
              <input
                style={styles.input}
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label style={styles.label}>Email Address *</label>
              <input
                style={styles.input}
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, email: e.target.value })
                }
                placeholder="jane@example.com"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Street Address *</label>
              <input
                style={styles.input}
                value={customerForm.line1}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, line1: e.target.value })
                }
                placeholder="123 Example St"
              />
            </div>
            <div>
              <label style={styles.label}>City *</label>
              <input
                style={styles.input}
                value={customerForm.city}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, city: e.target.value })
                }
                placeholder="Sydney"
              />
            </div>
            <div>
              <label style={styles.label}>State</label>
              <input
                style={styles.input}
                value={customerForm.state}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, state: e.target.value })
                }
                placeholder="NSW"
              />
            </div>
            <div>
              <label style={styles.label}>Postcode *</label>
              <input
                style={styles.input}
                value={customerForm.postal_code}
                onChange={(e) =>
                  setCustomerForm({
                    ...customerForm,
                    postal_code: e.target.value,
                  })
                }
                placeholder="2000"
              />
            </div>
            <div>
              <label style={styles.label}>Phone Number</label>
              <input
                style={styles.input}
                value={customerForm.phone}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, phone: e.target.value })
                }
                placeholder="0400 000 000"
              />
            </div>
          </div>
        </div>

        {/* PRODUCT CATALOG SECTION */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <ShoppingCart size={20} /> Add Products
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
              maxHeight: "400px",
              overflowY: "auto",
              paddingRight: "10px",
            }}
          >
            {products.map((p) => (
              <div key={p.id} style={styles.productCard}>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "6px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "#f1f5f9",
                        borderRadius: "6px",
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        color: "#0f172a",
                        lineHeight: "1.2",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      ${p.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <button onClick={() => addToCart(p)} style={styles.addBtn}>
                  <Plus size={16} /> Add to Order
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Summary & Cart */}
      <div style={{ ...styles.card, position: "sticky", top: "24px" }}>
        <h3 style={styles.cardTitle}>Order Summary</h3>

        {/* CART ITEMS */}
        <div
          style={{
            minHeight: "150px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "16px",
            marginBottom: "16px",
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                marginTop: "40px",
                fontSize: "0.9rem",
              }}
            >
              No items added yet.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    ${item.price.toFixed(2)} x {item.quantity}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div style={styles.qtyBox}>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={styles.qtyBtn}
                    >
                      -
                    </button>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SHIPPING & DISCOUNTS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label style={styles.label}>
              <Truck
                size={14}
                style={{ display: "inline", marginBottom: "-2px" }}
              />{" "}
              Shipping Method
            </label>
            <select
              style={styles.input}
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value)}
            >
              <option value="standard">Standard Shipping ($10.00)</option>
              <option value="express">Express Shipping ($15.00)</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>
              <Tag
                size={14}
                style={{ display: "inline", marginBottom: "-2px" }}
              />{" "}
              Discount Code
            </label>
            {appliedDiscount ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  padding: "8px 12px",
                  borderRadius: "6px",
                }}
              >
                <div
                  style={{
                    color: "#059669",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                  }}
                >
                  <CheckCircle
                    size={14}
                    style={{
                      display: "inline",
                      marginRight: "4px",
                      marginBottom: "-2px",
                    }}
                  />
                  {appliedDiscount.code} Applied
                </div>
                <button
                  onClick={removeDiscount}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#059669",
                    cursor: "pointer",
                  }}
                >
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  style={styles.input}
                  placeholder="e.g. SAVE20"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                />
                <button onClick={applyDiscount} style={styles.applyBtn}>
                  Apply
                </button>
              </div>
            )}
            {discountError && (
              <div
                style={{
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  marginTop: "4px",
                  fontWeight: "bold",
                }}
              >
                {discountError}
              </div>
            )}
          </div>
        </div>

        {/* TOTALS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ ...styles.summaryRow, color: "#059669" }}>
              <span>Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={styles.summaryRow}>
            <span>
              Shipping{" "}
              {appliedDiscount?.free_shipping && (
                <span
                  style={{
                    color: "#059669",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    background: "#d1fae5",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  FREE
                </span>
              )}
            </span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          <div
            style={{
              ...styles.summaryRow,
              fontSize: "1.2rem",
              fontWeight: "900",
              color: "#0f172a",
              marginTop: "8px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "12px",
            }}
          >
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleSubmitOrder}
          disabled={submitting || cart.length === 0}
          style={{
            ...styles.submitBtn,
            opacity: submitting || cart.length === 0 ? 0.5 : 1,
          }}
        >
          {submitting ? "Processing..." : "Create Custom Order"}
        </button>
      </div>
    </div>
  );
}

// --- INLINE STYLES ---
const styles = {
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "1.1rem",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 20px 0",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "12px",
  },
  label: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#64748b",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  },
  productCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    background: "#f8fafc",
  },
  addBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    background: "white",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    color: "#334155",
    cursor: "pointer",
  },
  qtyBox: {
    display: "flex",
    alignItems: "center",
    background: "#f1f5f9",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  qtyBtn: {
    background: "none",
    border: "none",
    padding: "4px 8px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#64748b",
  },
  applyBtn: {
    background: "#0f172a",
    color: "white",
    border: "none",
    padding: "0 16px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#475569",
    fontWeight: "600",
  },
  submitBtn: {
    width: "100%",
    background: "var(--medical-navy, #0f172a)", // Adapts to your global theme if set
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
};
