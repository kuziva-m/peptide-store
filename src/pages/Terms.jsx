export default function Terms() {
  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <h1>Terms & Conditions</h1>

      <div
        style={{
          marginTop: "40px",
          color: "var(--text-muted)",
          lineHeight: "1.8",
        }}
      >
        <h3>1. Research Use Only</h3>
        <p>
          By purchasing from PeptideStore, you acknowledge that all products are
          strictly for laboratory research use only. They are not intended for
          human or animal consumption.
        </p>

        <h3 style={{ marginTop: "30px" }}>2. Liability</h3>
        <p>
          PeptideStore shall not be held liable for any damages that result from
          the use of, or inability to use, the materials on this site.
        </p>

        <h3 style={{ marginTop: "30px" }}>3. Compliance</h3>
        <p>
          The purchaser is responsible for ensuring that their purchase and use
          of products comply with all local, state, and federal laws.
        </p>
      </div>
    </div>
  );
}
