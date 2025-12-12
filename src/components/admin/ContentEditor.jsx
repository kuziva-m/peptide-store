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
    alert("Saved!");
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
      {/* 1. SHIPPING CONFIG */}
      <Section title="Shipping Configuration">
        <label>Policy Text</label>
        <textarea
          rows={3}
          defaultValue={settings.shipping_policy?.text}
          onBlur={(e) =>
            handleSave("shipping_policy", {
              ...settings.shipping_policy,
              text: e.target.value,
            })
          }
          style={styles.textarea}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "10px",
          }}
        >
          <div>
            <label>Standard Price ($)</label>
            <input
              type="number"
              defaultValue={settings.shipping_policy?.price_standard}
              onBlur={(e) =>
                handleSave("shipping_policy", {
                  ...settings.shipping_policy,
                  price_standard: parseFloat(e.target.value),
                })
              }
              style={styles.input}
            />
          </div>
          <div>
            <label>Express Price ($)</label>
            <input
              type="number"
              defaultValue={settings.shipping_policy?.price_express}
              onBlur={(e) =>
                handleSave("shipping_policy", {
                  ...settings.shipping_policy,
                  price_express: parseFloat(e.target.value),
                })
              }
              style={styles.input}
            />
          </div>
        </div>
      </Section>

      {/* 2. HOME PAGE CONTENT */}
      <Section title="Home Page Content">
        <label>Hero Headline</label>
        <input
          defaultValue={settings.home_content?.hero_title}
          onBlur={(e) =>
            handleSave("home_content", {
              ...settings.home_content,
              hero_title: e.target.value,
            })
          }
          style={styles.input}
        />
        <label style={{ marginTop: "10px", display: "block" }}>
          Call to Action Label
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

      {/* 3. DISCOUNT POPUP */}
      <Section title="Discount Popup">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <input
            type="checkbox"
            defaultChecked={settings.discount_popup?.active}
            onChange={(e) =>
              handleSave("discount_popup", {
                ...settings.discount_popup,
                active: e.target.checked,
              })
            }
            style={{ width: "20px", height: "20px" }}
          />
          <span style={{ fontWeight: "600" }}>Enable Popup</span>
        </div>
        <label>Popup Text</label>
        <input
          defaultValue={settings.discount_popup?.text}
          onBlur={(e) =>
            handleSave("discount_popup", {
              ...settings.discount_popup,
              text: e.target.value,
            })
          }
          style={styles.input}
        />
        <label style={{ marginTop: "10px", display: "block" }}>
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

      {/* 4. PRIVACY POLICY */}
      <Section title="Privacy Policy">
        <textarea
          rows={6}
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
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontFamily: "inherit",
    resize: "vertical",
  },
};
