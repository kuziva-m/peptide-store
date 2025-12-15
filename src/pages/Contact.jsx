export default function Contact() {
  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <h1>Contact Us</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "40px" }}>
        For research inquiries, bulk orders, or technical support.
      </p>

      <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <input
            type="text"
            placeholder="Name"
            style={{
              padding: "12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          />
          <input
            type="email"
            placeholder="Email"
            style={{
              padding: "12px",
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          />
        </div>
        <input
          type="text"
          placeholder="Subject"
          style={{
            padding: "12px",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        />
        <textarea
          rows="6"
          placeholder="Message..."
          style={{
            padding: "12px",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontFamily: "inherit",
          }}
        ></textarea>
        <button
          className="buy-btn"
          style={{ width: "fit-content", padding: "12px 32px" }}
          onClick={(e) => {
            e.preventDefault();
            alert("Message sent!");
          }}
        >
          Send Inquiry
        </button>
      </form>
    </div>
  );
}
