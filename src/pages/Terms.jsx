import SEO from "../components/SEO";

export default function Terms() {
  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <SEO title="Terms of Service" />
      <h1 style={{ marginBottom: "2rem" }}>Terms of Service</h1>

      <div
        className="terms-content"
        style={{ lineHeight: "1.8", color: "var(--text-main)" }}
      >
        <p>
          <strong>Welcome to Melbourne Peptides.</strong>
        </p>
        <p>
          These Terms of Service govern your access to and use of our website
          melbournepeptides.com.au, including all products, services,
          information, and content made available through it (collectively, the
          “Site”).
        </p>
        <p>
          By accessing, browsing, or purchasing from our Site, you agree to be
          bound by these Terms of Service. Please read them carefully before
          using the Site.
        </p>

        <h3 style={headingStyle}>1. Research Use Only</h3>
        <p>
          All products sold by Melbourne Peptides are intended strictly for
          laboratory, educational, or scientific research purposes only.
        </p>
        <p>By purchasing from this Site, you confirm and acknowledge that:</p>
        <ul style={listStyle}>
          <li>
            You are a qualified researcher, laboratory, institution, or
            professional entity purchasing products for legitimate research
            purposes only;
          </li>
          <li>
            The products are not approved by the TGA (Therapeutic Goods
            Administration) or any other regulatory authority for human or
            animal use;
          </li>
          <li>
            You accept full responsibility for the lawful handling, storage, and
            use of all products purchased.
          </li>
        </ul>

        <h3 style={headingStyle}>2. Eligibility</h3>
        <p>To purchase from this Site, you must:</p>
        <ul style={listStyle}>
          <li>Be at least 18 years of age;</li>
          <li>
            Be legally capable of entering into a binding contract under
            Australian law;
          </li>
          <li>
            Agree to use all products solely for lawful research purposes and in
            compliance with all applicable laws and regulations.
          </li>
        </ul>

        <h3 style={headingStyle}>3. Product Information</h3>
        <p>
          We make reasonable efforts to ensure that all product descriptions,
          specifications, pricing, and availability information on the Site are
          accurate and current. However, Melbourne Peptides makes no warranties,
          express or implied, regarding the accuracy, completeness, or
          suitability of the information provided.
        </p>
        <ul style={listStyle}>
          <li>Product images are for illustrative purposes only.</li>
          <li>Products are supplied as-is.</li>
          <li>
            Certificates of Analysis (COA) are provided where available for
            research verification purposes only.
          </li>
        </ul>

        <h3 style={headingStyle}>4. Orders and Payment</h3>
        <p>
          All orders are subject to acceptance and availability. We reserve the
          right to refuse, limit, or cancel any order at our sole discretion,
          including where:
        </p>
        <ul style={listStyle}>
          <li>A product is unavailable;</li>
          <li>There is a pricing or description error;</li>
          <li>
            The order appears to be intended for non-research use or violates
            these Terms.
          </li>
        </ul>
        <p>
          Payments are processed securely via Shopify Payments or other approved
          payment gateways. All prices are listed in Australian Dollars (AUD)
          and include GST where applicable.
        </p>

        <h3 style={headingStyle}>5. Shipping and Delivery</h3>
        <p>We currently ship within Australia only.</p>
        <ul style={listStyle}>
          <li>
            Orders are typically dispatched promptly and generally arrive within
            1–3 business days, depending on location.
          </li>
          <li>Delivery timeframes are estimates only and not guaranteed.</li>
          <li>
            Melbourne Peptides is not responsible for delays caused by couriers,
            customs processes, or circumstances beyond our control.
          </li>
          <li>
            You are responsible for ensuring shipping details are accurate.
            Incorrect information may result in delivery delays or loss.
          </li>
        </ul>

        <h3 style={headingStyle}>6. Returns and Refunds</h3>
        <p>Due to the sensitive nature of research compounds:</p>
        <ul style={listStyle}>
          <li>
            Returns or exchanges are not accepted once an order has been
            dispatched.
          </li>
          <li>
            Refunds may be considered only if an incorrect item was supplied or
            items arrive damaged or defective (photo evidence required).
          </li>
          <li>
            Any issues must be reported within 48 hours of receiving your order.
          </li>
        </ul>

        <h3 style={headingStyle}>7. Limitation of Liability</h3>
        <p>To the maximum extent permitted by law:</p>
        <ul style={listStyle}>
          <li>
            Melbourne Peptides shall not be liable for any direct, indirect,
            incidental, or consequential damages arising from the use, misuse,
            or inability to use our products.
          </li>
          <li>
            You assume all risks associated with handling and using research
            compounds.
          </li>
          <li>
            Our total liability shall not exceed the purchase price of the
            product(s) in question.
          </li>
        </ul>

        <h3 style={headingStyle}>8. Intellectual Property</h3>
        <p>
          All content on this Site — including text, images, graphics, logos,
          and product descriptions — is the intellectual property of Melbourne
          Peptides or its licensors. You may not copy, reproduce, distribute, or
          exploit any content without prior written consent.
        </p>

        <h3 style={headingStyle}>9. Privacy and Data Protection</h3>
        <p>Your privacy is important to us.</p>
        <ul style={listStyle}>
          <li>
            Personal information is handled in accordance with our Privacy
            Policy.
          </li>
          <li>We do not store full payment card details.</li>
          <li>We do not sell your personal information to third parties.</li>
        </ul>

        <h3 style={headingStyle}>10. Compliance with Laws</h3>
        <p>
          By using this Site and purchasing products, you agree to comply with
          all applicable Australian federal, state, and local laws relating to
          the purchase, storage, handling, and disposal of research chemicals
          and peptides.
        </p>

        <h3 style={headingStyle}>11. Amendments</h3>
        <p>
          We reserve the right to update or modify these Terms of Service at any
          time without prior notice. Changes take effect immediately upon
          publication on this page.
        </p>

        <h3 style={headingStyle}>12. Contact Us</h3>
        <p>
          For any questions or concerns regarding these Terms of Service, please
          contact us via Instagram: <strong>@melbournepeptides</strong>
        </p>

        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "8px",
            color: "#991b1b",
          }}
        >
          <h4 style={{ marginTop: 0 }}>⚠️ Disclaimer</h4>
          <p style={{ marginBottom: 0 }}>
            All products sold by Melbourne Peptides are intended for laboratory
            research use only. They are not therapeutic goods and are not for
            human or veterinary consumption or application. By purchasing from
            this Site, you acknowledge and agree that all products will be used
            solely for lawful research purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

const headingStyle = {
  marginTop: "30px",
  marginBottom: "10px",
  color: "var(--medical-navy)",
};

const listStyle = {
  paddingLeft: "20px",
  marginBottom: "20px",
};
