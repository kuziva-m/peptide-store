import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Ticket,
  Plus,
  RefreshCw,
  Power,
  PowerOff,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function VoucherManager() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form State
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching vouchers:", error);
    else setVouchers(data || []);
    setLoading(false);
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed I, O, 0, 1 to prevent reading confusion
    let result = "CREDIT-";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewVoucher({ ...newVoucher, code: result });
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucher.code || !newVoucher.amount) return;

    const amount = parseFloat(newVoucher.amount);

    const { error } = await supabase.from("vouchers").insert([
      {
        code: newVoucher.code.toUpperCase(),
        initial_balance: amount,
        current_balance: amount,
        notes: newVoucher.notes,
      },
    ]);

    if (error) {
      console.error(error);
      if (error.code === "23505") {
        showToast("Error: That code already exists!");
      } else {
        showToast("Error creating voucher.");
      }
    } else {
      showToast("Voucher created successfully!");
      setNewVoucher({ code: "", amount: "", notes: "" });
      fetchVouchers();
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    const { error } = await supabase
      .from("vouchers")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      showToast("Failed to update status");
    } else {
      showToast(`Voucher ${!currentStatus ? "Activated" : "Deactivated"}`);
      fetchVouchers();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --- STYLES ---
  const s = {
    card: {
      background: "white",
      padding: "24px",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      marginBottom: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    title: {
      fontSize: "1.2rem",
      fontWeight: "bold",
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "20px",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "16px",
    },
    label: { fontSize: "0.85rem", fontWeight: "bold", color: "#64748b" },
    input: {
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "1rem",
      width: "100%",
    },
    btnPrimary: {
      background: "#4635de",
      color: "white",
      padding: "10px 20px",
      borderRadius: "8px",
      fontWeight: "bold",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      justifyContent: "center",
    },
    btnSecondary: {
      background: "#f1f5f9",
      color: "#475569",
      padding: "10px 16px",
      borderRadius: "8px",
      fontWeight: "bold",
      border: "1px solid #e2e8f0",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    toast: {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "#0f172a",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      zIndex: 9999,
    },
    tableHeader: {
      textAlign: "left",
      padding: "12px 16px",
      color: "#64748b",
      fontSize: "0.85rem",
      textTransform: "uppercase",
      borderBottom: "2px solid #e2e8f0",
    },
    tableCell: {
      padding: "16px",
      borderBottom: "1px solid #f1f5f9",
      color: "#334155",
      fontSize: "0.95rem",
    },
  };

  return (
    <div>
      {/* CREATION FORM */}
      <div style={s.card}>
        <div style={s.title}>
          <Ticket size={20} color="#4635de" /> Create Store Credit Voucher
        </div>

        <form
          onSubmit={handleCreateVoucher}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div style={s.inputGroup}>
            <label style={s.label}>Voucher Code</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                required
                style={{ ...s.input, textTransform: "uppercase" }}
                placeholder="e.g. SORRY50 or REFUND-X8"
                value={newVoucher.code}
                onChange={(e) =>
                  setNewVoucher({
                    ...newVoucher,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
              <button
                type="button"
                onClick={generateRandomCode}
                style={s.btnSecondary}
                title="Generate Secure Code"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Dollar Amount ($)</label>
            <div style={{ position: "relative" }}>
              <DollarSign
                size={16}
                color="#94a3b8"
                style={{ position: "absolute", left: "10px", top: "12px" }}
              />
              <input
                required
                type="number"
                step="0.01"
                min="1"
                style={{ ...s.input, paddingLeft: "32px" }}
                placeholder="50.00"
                value={newVoucher.amount}
                onChange={(e) =>
                  setNewVoucher({ ...newVoucher, amount: e.target.value })
                }
              />
            </div>
          </div>

          <div style={{ ...s.inputGroup, gridColumn: "span 2" }}>
            <label style={s.label}>Internal Notes (Optional)</label>
            <input
              style={s.input}
              placeholder="e.g. Apology for late shipping - Sarah Smith"
              value={newVoucher.notes}
              onChange={(e) =>
                setNewVoucher({ ...newVoucher, notes: e.target.value })
              }
            />
          </div>

          <div
            style={{
              gridColumn: "span 2",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button type="submit" style={s.btnPrimary}>
              <Plus size={18} /> Issue Voucher
            </button>
          </div>
        </form>
      </div>

      {/* LEDGER TABLE */}
      <div style={s.card}>
        <div style={s.title}>Voucher Ledger</div>

        {loading ? (
          <div style={{ padding: "20px", color: "#64748b" }}>
            Loading ledger...
          </div>
        ) : vouchers.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8fafc",
              borderRadius: "8px",
            }}
          >
            No vouchers issued yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={s.tableHeader}>Code</th>
                  <th style={s.tableHeader}>Balance Remaining</th>
                  <th style={s.tableHeader}>Expires</th>
                  <th style={s.tableHeader}>Status</th>
                  <th style={s.tableHeader}>Notes</th>
                  <th style={s.tableHeader}>Action</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => {
                  const isZero = Number(v.current_balance) === 0;
                  const isExpired = new Date(v.expires_at) < new Date();
                  const isDead = isZero || isExpired || !v.is_active;

                  return (
                    <tr key={v.id} style={{ opacity: isDead ? 0.6 : 1 }}>
                      <td style={s.tableCell}>
                        <strong
                          style={{
                            background: "#f1f5f9",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            letterSpacing: "1px",
                          }}
                        >
                          {v.code}
                        </strong>
                      </td>
                      <td style={s.tableCell}>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: isZero ? "#94a3b8" : "#16a34a",
                            fontSize: "1.1rem",
                          }}
                        >
                          ${Number(v.current_balance).toFixed(2)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          of ${Number(v.initial_balance).toFixed(2)}
                        </div>
                      </td>
                      <td style={s.tableCell}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            color: isExpired ? "#ef4444" : "#64748b",
                          }}
                        >
                          <Calendar size={14} /> {formatDate(v.expires_at)}
                        </div>
                      </td>
                      <td style={s.tableCell}>
                        {isZero ? (
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#64748b",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                            }}
                          >
                            DEPLETED
                          </span>
                        ) : isExpired ? (
                          <span
                            style={{
                              background: "#fee2e2",
                              color: "#b91c1c",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                            }}
                          >
                            EXPIRED
                          </span>
                        ) : v.is_active ? (
                          <span
                            style={{
                              background: "#dcfce7",
                              color: "#166534",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                            }}
                          >
                            ACTIVE
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#fee2e2",
                              color: "#b91c1c",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                            }}
                          >
                            KILLED
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          ...s.tableCell,
                          maxWidth: "200px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {v.notes || "-"}
                      </td>
                      <td style={s.tableCell}>
                        <button
                          onClick={() => handleToggleActive(v.id, v.is_active)}
                          style={{
                            background: v.is_active ? "#fee2e2" : "#dcfce7",
                            color: v.is_active ? "#b91c1c" : "#166534",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {v.is_active ? (
                            <>
                              <PowerOff size={14} /> Kill
                            </>
                          ) : (
                            <>
                              <Power size={14} /> Reactivate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notification && (
        <div style={s.toast}>
          <CheckCircle size={16} color="#10b981" /> {notification}
        </div>
      )}
    </div>
  );
}
