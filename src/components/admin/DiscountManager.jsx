import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2, Plus, Save, X, Tag } from "lucide-react";

export default function DiscountManager() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState({
    code: "",
    type: "percentage",
    value: 10,
    free_shipping: false,
    active: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    const { data } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });
    setDiscounts(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newCode.code) return alert("Code is required");

    const { error } = await supabase.from("discounts").insert([newCode]);
    if (error) {
      alert("Error adding code: " + error.message);
    } else {
      setIsAdding(false);
      setNewCode({
        code: "",
        type: "percentage",
        value: 10,
        free_shipping: false,
        active: true,
      });
      fetchDiscounts();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this code?")) return;
    await supabase.from("discounts").delete().eq("id", id);
    fetchDiscounts();
  };

  const toggleActive = async (id, currentStatus) => {
    await supabase
      .from("discounts")
      .update({ active: !currentStatus })
      .eq("id", id);
    fetchDiscounts();
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "white",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Tag size={20} /> Discount Codes
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          style={{
            background: "#0f172a",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={16} /> Add Code
        </button>
      </div>

      {isAdding && (
        <div
          style={{
            background: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto auto",
              gap: "10px",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  marginBottom: "4px",
                }}
              >
                Code Name
              </label>
              <input
                placeholder="e.g. SUMMER20"
                value={newCode.code}
                onChange={(e) =>
                  setNewCode({ ...newCode, code: e.target.value.toUpperCase() })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  marginBottom: "4px",
                }}
              >
                Type
              </label>
              <select
                value={newCode.type}
                onChange={(e) =>
                  setNewCode({ ...newCode, type: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  marginBottom: "4px",
                }}
              >
                Value
              </label>
              <input
                type="number"
                value={newCode.value}
                onChange={(e) =>
                  setNewCode({ ...newCode, value: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
            <div style={{ paddingBottom: "10px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newCode.free_shipping}
                  onChange={(e) =>
                    setNewCode({ ...newCode, free_shipping: e.target.checked })
                  }
                />
                <span style={{ fontSize: "0.9rem" }}>Free Ship?</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleAdd}
                style={{
                  background: "#10b981",
                  color: "white",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => setIsAdding(false)}
                style={{
                  background: "#94a3b8",
                  color: "white",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading codes...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left" }}
            >
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                Code
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                Effect
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "0.85rem",
                  color: "#64748b",
                  fontWeight: "600",
                  textAlign: "right",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td
                  style={{
                    padding: "12px 8px",
                    fontSize: "0.9rem",
                    color: "#334155",
                  }}
                >
                  <strong>{d.code}</strong>
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    fontSize: "0.9rem",
                    color: "#334155",
                  }}
                >
                  {d.type === "percentage"
                    ? `${d.value}% Off`
                    : `$${d.value} Off`}
                  {d.free_shipping && (
                    <span
                      style={{
                        marginLeft: "8px",
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}
                    >
                      Free Ship
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    fontSize: "0.9rem",
                    color: "#334155",
                  }}
                >
                  <button
                    onClick={() => toggleActive(d.id, d.active)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      border: "none",
                      background: d.active ? "#dcfce7" : "#f1f5f9",
                      color: d.active ? "#166534" : "#64748b",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {d.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    fontSize: "0.9rem",
                    color: "#334155",
                    textAlign: "right",
                  }}
                >
                  <button
                    onClick={() => handleDelete(d.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
