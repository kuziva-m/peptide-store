export default function FAQ() {
  const faqs = [
    {
      q: "Are your products for human consumption?",
      a: "No. All products listed on this site are for Research Use Only (RUO). They are not intended for use in diagnostic or therapeutic procedures for humans or animals.",
    },
    {
      q: "How should I store my peptides?",
      a: "Lyophilized peptides should be stored at -20°C. Once reconstituted with bacteriostatic water, they must be kept refrigerated at 4°C and used within 30 days.",
    },
    {
      q: "Do you provide purity testing?",
      a: "Yes. Every batch is HPLC and MS tested to ensure >99% purity. COAs are available upon request.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept major credit cards and select cryptocurrencies for secure transactions.",
    },
  ];

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <h1>Frequently Asked Questions</h1>

      <div
        style={{
          marginTop: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {faqs.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "24px",
              background: "white",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>
              {item.q}
            </h3>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
