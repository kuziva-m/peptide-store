import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import SEO from "../components/SEO";
import "./Privacy.css";

export default function Privacy() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    async function fetchPolicy() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "privacy_policy")
        .single();

      if (data?.value?.text) {
        setContent(data.value.text);
      }
    }
    fetchPolicy();
  }, []);

  // DEFAULT CONTENT (Fallback if DB is empty)
  const defaultContent = `
    <p>
      Melbourne Peptides operates this website, <strong>melbournepeptides.com.au</strong> (the “Site”), 
      including all related information, content, features, tools, products, and services 
      (collectively, the “Services”) to provide customers with a curated online shopping experience.
    </p>
    <p>
      This Privacy Policy explains how we collect, use, store, and disclose your personal 
      information when you visit, use, or make a purchase through the Services, or otherwise 
      interact or communicate with us.
    </p>
    <p class="highlight-box">
      By accessing or using any part of the Services, you acknowledge that you have read and understood this Privacy Policy.
    </p>
    
    <h2>1. Personal Information We Collect</h2>
    <p>
      “Personal information” refers to information that identifies, relates to, describes, 
      or can reasonably be linked to you. It does not include anonymous or de-identified information.
    </p>
    <ul class="styled-list">
      <li><strong>Contact information:</strong> Name, shipping address, billing address, phone number, and order-related details.</li>
      <li><strong>Payment information:</strong> Payment method, transaction status, and purchase history (note: payment details are processed securely through third-party payment providers).</li>
      <li><strong>Account information:</strong> Login details, preferences, and settings if you create an account.</li>
      <li><strong>Order activity:</strong> Products viewed, added to cart, purchased, returned, or exchanged.</li>
      <li><strong>Communications:</strong> Messages or inquiries sent to us through social media or the website.</li>
      <li><strong>Device data:</strong> IP address, browser type, device identifiers, and network information.</li>
    </ul>

    <h2>2. Sources of Personal Information</h2>
    <ul class="styled-list">
      <li><strong>Directly from you:</strong> When you place an order, contact us, or interact with the Services.</li>
      <li><strong>Automatically:</strong> Through cookies, pixels, and similar technologies when you browse the Site.</li>
      <li><strong>From service providers:</strong> Including those who assist with website hosting, payments, analytics, marketing, shipping, and order fulfillment.</li>
    </ul>

    <h2>3. How We Use Your Personal Information</h2>
    <div class="grid-2-col">
      <div class="info-card">
        <h3>Services</h3>
        <p>To process orders, accept payments, arrange shipping, manage returns, and improve functionality.</p>
      </div>
      <div class="info-card">
        <h3>Communication</h3>
        <p>To respond to inquiries, provide customer assistance, and maintain our relationship with you.</p>
      </div>
      <div class="info-card">
        <h3>Security</h3>
        <p>To verify transactions, protect against fraud, unauthorized access, and maintain security.</p>
      </div>
      <div class="info-card">
        <h3>Compliance</h3>
        <p>To comply with applicable laws, legal processes, and enforce our policies.</p>
      </div>
    </div>

    <h2>4. Disclosure of Personal Information</h2>
    <p>We may share your personal information in limited circumstances, including:</p>
    <ul class="styled-list">
      <li>With <strong>Shopify</strong> and service providers (payments, shipping, IT).</li>
      <li>With affiliated businesses within our corporate structure.</li>
      <li>When required by law or to protect our legal rights, users, or the Services.</li>
    </ul>

    <h2>5. Data Retention & Security</h2>
    <p>
      We take reasonable steps to protect your personal information, but no method of transmission or storage is completely secure. 
      Information is retained only as long as necessary to fulfill the purposes outlined in this Privacy Policy.
    </p>

    <h2>6. Your Rights</h2>
    <p>Depending on your location, you may have rights regarding your personal information, including:</p>
    <ul class="styled-list">
      <li>The right to access or request a copy of your personal data.</li>
      <li>The right to request correction of inaccurate information.</li>
      <li>The right to request deletion of your personal information.</li>
      <li>The right to opt out of marketing communications.</li>
    </ul>

    <div class="contact-section">
      <h2>Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our privacy practices, please contact us via Instagram:
      </p>
      <a href="https://instagram.com/melbournepeptides" target="_blank" rel="noreferrer" class="contact-btn">
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
          {/* Render HTML content (Safe because it comes from Admin or hardcoded) */}
          <div
            dangerouslySetInnerHTML={{ __html: content || defaultContent }}
          />
        </div>
      </div>
    </div>
  );
}
