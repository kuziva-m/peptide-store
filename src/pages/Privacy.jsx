import SEO from "../components/SEO";
import "./Privacy.css";

export default function Privacy() {
  // We removed the database fetch so this static content ALWAYS shows.
  const content = `
    <p>
      Melbourne Peptides operates this website, <strong>melbournepeptides.com.au</strong> (the “Site”), 
      including all related information, content, features, tools, products, and services 
      (collectively, the “Services”) to provide customers with a curated online shopping experience.
    </p>
    <p>
      This Privacy Policy explains how we collect, use, store, and disclose your personal information 
      when you visit, use, or make a purchase through the Services, or otherwise interact or communicate with us. 
      If there is any conflict between our Terms of Service and this Privacy Policy, this Privacy Policy governs 
      the handling of your personal information.
    </p>
    <p class="highlight-box">
      By accessing or using any part of the Services, you acknowledge that you have read and understood this Privacy Policy.
    </p>

    <h2>Personal Information We Collect</h2>
    <p>
      “Personal information” refers to information that identifies, relates to, describes, or can reasonably be linked to you. 
      It does not include anonymous or de-identified information. Depending on how you interact with our Services and what is 
      permitted by law, we may collect the following categories of personal information:
    </p>
    <ul class="styled-list">
      <li><strong>Contact information:</strong> Such as your name, shipping address, billing address, phone number, and order-related details.</li>
      <li><strong>Payment and transaction information:</strong> Including payment method, transaction status, and purchase history (note: payment details are processed securely through third-party payment providers).</li>
      <li><strong>Account information:</strong> Such as login details, preferences, and settings if you create an account.</li>
      <li><strong>Order activity:</strong> Including products viewed, added to cart, purchased, returned, or exchanged.</li>
      <li><strong>Communications:</strong> Including messages or inquiries sent to us through social media or the website.</li>
      <li><strong>Device and technical data:</strong> Including IP address, browser type, device identifiers, and network information.</li>
      <li><strong>Usage data:</strong> Relating to how you interact with and navigate the Services.</li>
    </ul>

    <h2>Sources of Personal Information</h2>
    <p>We collect personal information from the following sources:</p>
    <ul class="styled-list">
      <li><strong>Directly from you:</strong> When you place an order, contact us, or interact with the Services.</li>
      <li><strong>Automatically:</strong> Through cookies, pixels, and similar technologies when you browse the Site.</li>
      <li><strong>From service providers:</strong> Including those who assist with website hosting, payments, analytics, marketing, shipping, and order fulfillment.</li>
      <li><strong>From third parties:</strong> Such as social media platforms when you interact with us through them.</li>
    </ul>

    <h2>How We Use Your Personal Information</h2>
    <div class="grid-2-col">
      <div class="info-card">
        <h3>Providing and Improving the Services</h3>
        <p>To process orders, accept payments, arrange shipping, manage returns or exchanges, maintain accounts, personalize your shopping experience, and improve the functionality and performance of the Services.</p>
      </div>
      <div class="info-card">
        <h3>Marketing and Promotions</h3>
        <p>To communicate promotional offers, product updates, and marketing content through permitted channels, including social media and online advertising.</p>
      </div>
      <div class="info-card">
        <h3>Security and Fraud Prevention</h3>
        <p>To verify transactions, protect against unauthorized access, fraud, misuse, or other harmful activity, and maintain the security of our Services.</p>
      </div>
      <div class="info-card">
        <h3>Communication and Support</h3>
        <p>To respond to inquiries, provide customer assistance, and maintain our relationship with you.</p>
      </div>
    </div>
    <div class="info-card" style="margin-top: 1rem;">
      <h3>Legal and Compliance</h3>
      <p>To comply with applicable laws, regulations, legal processes, or to enforce our policies and protect our rights.</p>
    </div>

    <h2>Disclosure of Personal Information</h2>
    <p>We may share your personal information in limited circumstances, including:</p>
    <ul class="styled-list">
      <li>With <strong>Shopify</strong> and other service providers that help us operate the Services (such as payment processors, analytics providers, shipping partners, and IT support).</li>
      <li>With marketing and advertising partners to display relevant promotions.</li>
      <li>When you request or consent to disclosure (for example, during checkout or shipping).</li>
      <li>With affiliated businesses within our corporate structure.</li>
      <li>In connection with a business transaction such as a merger, sale, or restructuring.</li>
      <li>When required by law or to protect our legal rights, users, or the Services.</li>
    </ul>

    <h2>Relationship with Shopify</h2>
    <p>
      Our store is hosted on Shopify. Shopify processes personal information to provide and improve the Services. 
      Information submitted through the Site may be transferred to and processed by Shopify and its partners, 
      including in countries outside your place of residence.
    </p>
    <p>
      Shopify may use aggregated data from interactions with multiple merchants to improve its platform. 
      In such cases, Shopify acts as an independent data controller. More information about Shopify’s data practices 
      is available in the Shopify Consumer Privacy Policy.
    </p>

    <h2>Third-Party Links</h2>
    <p>
      The Services may contain links to third-party websites or platforms. We are not responsible for the privacy practices, 
      security, or content of those third parties. Any information you share on external platforms is governed by their own privacy policies.
    </p>

    <h2>Children’s Privacy</h2>
    <p>
      The Services are not intended for use by children under the age of majority in their jurisdiction. 
      We do not knowingly collect personal information from children. If a parent or guardian believes a child has 
      provided personal information, they may contact us to request deletion.
    </p>

    <h2>Data Security and Retention</h2>
    <p>
      We take reasonable steps to protect your personal information, but no method of transmission or storage is completely secure. 
      Information is retained only as long as necessary to fulfill the purposes outlined in this Privacy Policy, 
      comply with legal obligations, resolve disputes, or enforce agreements.
    </p>

    <h2>Your Rights and Choices</h2>
    <p>Depending on your location, you may have rights regarding your personal information, including:</p>
    <ul class="styled-list">
      <li>The right to access or request a copy of your personal data.</li>
      <li>The right to request correction of inaccurate information.</li>
      <li>The right to request deletion of your personal information.</li>
      <li>The right to data portability, where applicable.</li>
      <li>The right to opt out of marketing communications.</li>
    </ul>
    <p>Requests may be subject to identity verification and legal limitations.</p>

    <h2>International Data Transfers</h2>
    <p>
      Your personal information may be transferred to and processed in countries outside your own. 
      Where required, appropriate safeguards are used to protect your data in accordance with applicable laws.
    </p>

    <h2>Changes to This Privacy Policy</h2>
    <p>
      We may update this Privacy Policy periodically to reflect changes in practices, legal requirements, or operational reasons. 
      Updates will be posted on this page with a revised effective date.
    </p>

    <div class="contact-section">
      <h2>Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our privacy practices, or if you wish to exercise your rights, please contact us via Instagram:
      </p>
      <a href="https://instagram.com/mpresearch.au" target="_blank" rel="noreferrer" class="contact-btn">
        @melbournepeptides
      </a>
    </div>
  `;

  return (
    <div className="privacy-page">
      <SEO title="Privacy Policy" />

      <div className="container">
        <div className="privacy-header">
          <h1>Privacy Policy</h1>
          <div className="last-updated">
            Effective Date: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="privacy-content">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
}
