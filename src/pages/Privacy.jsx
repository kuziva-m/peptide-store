export default function Privacy() {
  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <h1>Privacy Policy</h1>
      <p style={{ color: "var(--text-muted)", marginTop: "20px" }}>
        Effective Date: {new Date().toLocaleDateString()}
      </p>
      <div
        style={{
          marginTop: "40px",
          color: "var(--text-muted)",
          lineHeight: "1.8",
        }}
      >
        <p>
          At PeptideStore, we take your privacy seriously. We collect minimal
          data required to process your order.
        </p>
        <p>
          We do not sell, trade, or otherwise transfer your personally
          identifiable information to outside parties. This does not include
          trusted third parties who assist us in operating our website or
          servicing you, as long as those parties agree to keep this information
          confidential.
        </p>
        <p>
          All transactions are processed through a gateway provider and are not
          stored or processed on our servers.
        </p>
      </div>
    </div>
  );
}
