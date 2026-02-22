import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Save, Loader } from "lucide-react";

export default function ContentEditor() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // Key being saved

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    if (data) {
      // Convert array to object: { key: value }
      const map = data.reduce(
        (acc, item) => ({ ...acc, [item.key]: item.value }),
        {}
      );
      setSettings(map);
    }
    setLoading(false);
  };

  const handleSave = async (key, value) => {
    setSaving(key);
    await supabase.from("site_settings").upsert({ key, value });
    setSaving(null);
  };

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Loader className="spin-anim" />
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        maxWidth: "800px",
      }}
    >
      {/* 1. HOME PAGE CONTENT */}
      <Section title="Home Page Banner">
        <label style={styles.label}>Headline</label>
        <input
          defaultValue={settings.home_content?.hero_headline}
          onBlur={(e) =>
            handleSave("home_content", {
              ...settings.home_content,
              hero_headline: e.target.value,
            })
          }
          style={styles.input}
        />
        <label style={{ ...styles.label, marginTop: "15px" }}>
          Sub-Headline
        </label>
        <textarea
          rows={3}
          defaultValue={settings.home_content?.hero_subheadline}
          onBlur={(e) =>
            handleSave("home_content", {
              ...settings.home_content,
              hero_subheadline: e.target.value,
            })
          }
          style={styles.textarea}
        />
        <label style={{ ...styles.label, marginTop: "15px" }}>
          Button Text
        </label>
        <input
          defaultValue={settings.home_content?.hero_cta}
          onBlur={(e) =>
            handleSave("home_content", {
              ...settings.home_content,
              hero_cta: e.target.value,
            })
          }
          style={styles.input}
        />
      </Section>

      {/* 2. ANNOUNCEMENT BAR */}
      <Section title="Announcement Bar">
        <label style={styles.label}>Message</label>
        <input
          defaultValue={settings.announcement_bar?.text}
          onBlur={(e) =>
            handleSave("announcement_bar", {
              ...settings.announcement_bar,
              text: e.target.value,
            })
          }
          style={styles.input}
        />
      </Section>

      {/* 3. DISCOUNT POPUP */}
      <Section title="Discount Popup">
        <label style={styles.label}>Popup Title</label>
        <input
          defaultValue={settings.discount_popup?.title}
          onBlur={(e) =>
            handleSave("discount_popup", {
              ...settings.discount_popup,
              title: e.target.value,
            })
          }
          style={styles.input}
        />
        <label style={{ ...styles.label, marginTop: "15px" }}>
          Discount Code
        </label>
        <input
          defaultValue={settings.discount_popup?.code}
          onBlur={(e) =>
            handleSave("discount_popup", {
              ...settings.discount_popup,
              code: e.target.value,
            })
          }
          style={styles.input}
        />
      </Section>

      {/* 4. SHIPPING POLICY (NEW) */}
      <Section title="Shipping Policy">
        <p
          style={{
            fontSize: "0.85rem",
            color: "#64748b",
            marginBottom: "10px",
          }}
        >
          This text will appear on the Shipping & Returns page.
        </p>
        <textarea
          rows={8}
          defaultValue={settings.shipping_policy?.text}
          placeholder="We process all orders within 24 hours..."
          onBlur={(e) =>
            handleSave("shipping_policy", { text: e.target.value })
          }
          style={styles.textarea}
        />
      </Section>

      {/* 5. PRIVACY POLICY */}
      <Section title="Privacy Policy">
        <p
          style={{
            fontSize: "0.85rem",
            color: "#64748b",
            marginBottom: "10px",
          }}
        >
          HTML is supported for formatting (e.g. &lt;strong&gt;, &lt;p&gt;).
        </p>
        <textarea
          rows={12}
          defaultValue={settings.privacy_policy?.text}
          onBlur={(e) => handleSave("privacy_policy", { text: e.target.value })}
          style={styles.textarea}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "20px",
          color: "var(--medical-navy)",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "10px",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

const styles = {
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    fontFamily: "inherit",
  },
};
