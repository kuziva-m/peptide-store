export default function Shipping() {
  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <h1>Shipping & Returns</h1>

      <div style={{ marginTop: "40px" }}>
        <h3>Shipping Policy</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
          All peptides are shipped in lyophilized powder form to ensure
          stability during transit. While peptides are stable at room
          temperature for short periods, we recommend expedited shipping
          options.
        </p>
        <ul
          style={{
            color: "var(--text-muted)",
            marginLeft: "20px",
            marginBottom: "40px",
          }}
        >
          <li>Orders placed before 2 PM EST ship same-day.</li>
          <li>Discreet packaging is standard for all orders.</li>
          <li>International shipping is available to select jurisdictions.</li>
        </ul>

        <h3>Return Policy</h3>
        <p style={{ color: "var(--text-muted)" }}>
          Due to the nature of research chemicals,{" "}
          <strong>we cannot accept returns</strong> once the product has left
          our facility. If you believe there is a quality issue, please contact
          us with your batch number for a certificate of analysis review.
        </p>
      </div>
    </div>
  );
}
