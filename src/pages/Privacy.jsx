import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Privacy() {
  const [text, setText] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "privacy_policy")
      .single()
      .then(({ data }) => {
        if (data) setText(data.value.text);
      });
  }, []);

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
          whiteSpace: "pre-wrap",
        }}
      >
        {text || "Loading policy..."}
      </div>
    </div>
  );
}
