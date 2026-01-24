export const styles = {
  // --- STATS BAR ---
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr",
    alignItems: "center",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
    overflowX: "auto", // Allow scroll on very small screens
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "0 10px",
  },
  statDivider: {
    width: "1px",
    height: "40px",
    background: "#e2e8f0",
  },
  statLabel: {
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#0f172a",
  },

  // --- TOOLBAR (Filter & Actions) ---
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px",
  },
  filterGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    border: "1px solid",
    transition: "all 0.2s",
  },

  // --- EXPORT BUTTON STYLING ---
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px", // Space between Icon and Text
    background: "white",
    border: "1px solid #cbd5e1",
    color: "#334155",
    padding: "10px 18px", // Increased Padding
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    minWidth: "fit-content",
  },

  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "white",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "8px 12px",
    width: "100%",
    maxWidth: "300px",
  },
  inputReset: {
    border: "none",
    outline: "none",
    fontSize: "0.9rem",
    width: "100%",
    color: "#334155",
  },

  // --- TABS (Live / Abandoned) ---
  tabContainer: {
    display: "flex",
    gap: "4px",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: "10px",
    marginBottom: "20px",
    width: "fit-content",
  },
  tabBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
  },
  activeTab: {
    background: "white",
    color: "#0f172a",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  inactiveTab: {
    background: "transparent",
    color: "#64748b",
  },

  // --- CHANGED: TABLE CONTAINER (Transparent) ---
  tableContainer: {
    background: "transparent", // Removed white background
    borderRadius: "0",
    border: "none",
    overflow: "visible", // Allow cards to show shadow
    display: "flex",
    flexDirection: "column",
    gap: "12px", // Space between cards
  },
  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "0.95rem",
  },

  // --- CHANGED: ORDER ROW (Card Style) ---
  orderRow: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    overflow: "hidden",
    transition: "all 0.2s ease",
    marginBottom: "0",
  },
  rowHeader: {
    display: "grid",
    // Responsive Grid: Info | Status | Total | Actions
    gridTemplateColumns: "1.5fr 1fr 0.8fr auto auto",
    alignItems: "center",
    padding: "16px 20px",
    cursor: "pointer",
    gap: "10px",
  },
  colInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  primaryText: { fontSize: "0.95rem", fontWeight: "700", color: "#0f172a" },
  metaText: { fontSize: "0.8rem", color: "#64748b" },

  colStatus: { textAlign: "center" },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    border: "1px solid",
    display: "inline-block",
  },

  colTotal: { fontSize: "0.95rem", fontWeight: "700", color: "#0f172a" },

  actionIconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    padding: "8px",
    borderRadius: "6px",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
  },

  // --- EXPANDED PANEL ---
  expandedPanel: {
    background: "#f8fafc",
    padding: "20px",
    borderTop: "1px solid #f1f5f9",
    animation: "fadeIn 0.2s ease-out",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  customerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px 20px",
  },
  customerItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.9rem",
    color: "#334155",
  },

  // --- ITEMS TABLE ---
  panelGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr", // Items take 2/3, Manage takes 1/3
    gap: "24px",
  },
  itemsTable: {
    background: "white",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    background: "#f1f5f9",
    padding: "8px 12px",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "0.9rem",
  },
  itemQty: { width: "40px", fontWeight: "600", color: "#64748b" },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: "600", color: "#334155", display: "block" },
  variantLabel: { fontSize: "0.8rem", color: "#94a3b8" },
  itemPrice: { width: "80px", textAlign: "right", fontWeight: "600" },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "#f8fafc",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#475569",
  },

  // --- ACTIONS & NOTES ---
  detailCol: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  noteInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  saveNoteBtn: {
    background: "#0f172a",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.85rem",
  },

  trackingBox: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "center",
  },
  trackingLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  actionBtn: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#475569",
    fontWeight: "600",
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  secondaryBtn: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px dashed #94a3b8",
    background: "transparent",
    color: "#64748b",
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  saveBtn: {
    flex: 1,
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cancelBtn: {
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  // --- EXTRAS ---
  noteBubble: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "#eff6ff",
    padding: "2px 8px",
    borderRadius: "12px",
    border: "1px solid #dbeafe",
  },
  noteText: {
    fontSize: "0.75rem",
    color: "#2563eb",
    fontWeight: "600",
  },
  toast: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#10b981",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
    fontWeight: "600",
    animation: "slideUp 0.3s ease-out",
  },

  // --- MODAL ---
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    backdropFilter: "blur(2px)",
  },
  modalContent: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  modalTitle: { margin: 0, fontSize: "1.1rem" },
  modalMessage: { color: "#64748b", lineHeight: "1.5", marginBottom: "24px" },
  modalActions: { display: "flex", gap: "10px", justifyContent: "flex-end" },
  modalCancel: {
    background: "white",
    border: "1px solid #cbd5e1",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#64748b",
  },
  modalConfirm: {
    background: "#0f172a",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    color: "white",
  },
  modalDelete: {
    background: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    color: "white",
  },

  // --- INPUT STYLES (General) ---
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
};

// CSS Injection for Animations & Mobile Tweaks
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  
  @media (max-width: 768px) {
    /* Stack stats vertically on mobile */
    div[style*="grid-template-columns: 1fr 1px 1fr"] {
      grid-template-columns: 1fr 1fr !important;
      gap: 20px 0 !important;
    }
    div[style*="width: 1px"] { display: none; } /* Hide vertical dividers on mobile */
    
    /* Stack row header on mobile */
    div[style*="grid-template-columns: 1.5fr 1fr"] {
      grid-template-columns: 1fr auto !important;
      gap: 12px !important;
    }
    /* Hide some columns on mobile if needed, or adjust */
    
    /* Panel Grid Stacking */
    div[style*="grid-template-columns: 2fr 1fr"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleTag);
