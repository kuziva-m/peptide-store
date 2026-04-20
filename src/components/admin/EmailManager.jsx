import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Send,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  Inbox,
  RefreshCw,
  Trash2,
  ArrowLeft,
  Reply,
  Calendar,
  User,
} from "lucide-react";
import "./EmailManager.css"; // Imports the CSS file

// Assumes logo.png is in your public folder
const LOGO_URL = "/logo.png";

export default function EmailManager() {
  const [activeTab, setActiveTab] = useState("compose"); // 'compose' | 'inbox'
  const [inboxMessages, setInboxMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // State to track which message is currently open
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    message: "",
  });

  // --- FETCH INBOX ---
  useEffect(() => {
    if (activeTab === "inbox") fetchInbox();

    const subscription = supabase
      .channel("inbox_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inbox_messages" },
        (payload) => setInboxMessages((prev) => [payload.new, ...prev]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeTab]);

  const fetchInbox = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inbox_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInboxMessages(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    await supabase.from("inbox_messages").delete().eq("id", id);
    if (selectedMessage?.id === id) setSelectedMessage(null); // Close if open
    fetchInbox();
  };

  // --- REPLY LOGIC ---
  const handleReply = (msg) => {
    // 1. Format the "On [Date], [Person] wrote:" quote
    const dateStr = new Date(msg.created_at).toLocaleString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const quoteHeader = `\n\n\n\n--------------------------------------------------\nOn ${dateStr}, ${msg.sender} wrote:\n\n`;
    const originalBody = msg.body_text || "No text content.";

    // 2. Pre-fill the form
    setFormData({
      to: msg.sender,
      // Add "Re:" only if it's not already there
      subject: msg.subject?.startsWith("Re:")
        ? msg.subject
        : `Re: ${msg.subject || "No Subject"}`,
      message: quoteHeader + originalBody,
    });

    // 3. Switch tabs
    setSelectedMessage(null);
    setActiveTab("compose");
  };

  const generateEmailTemplate = (message, subject) => {
    // Uses absolute URL for images in email
    const fullLogoUrl = `${window.location.origin}${LOGO_URL}`;
    return `
      <!DOCTYPE html>
      <html>
      <body style="background-color: #fbfaf8; font-family: sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
          <img src="${fullLogoUrl}" alt="Melbourne Peptides" width="150" style="margin-bottom: 20px;">
          <div style="border-top: 4px solid #0074d4; padding-top: 20px;">
            <h2 style="color: #09090b;">${subject}</h2>
            <p style="color: #3f3f46; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">Sent via Melbourne Peptides Admin</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const htmlBody = generateEmailTemplate(
        formData.message,
        formData.subject,
      );

      // Calls your 'send-email' edge function
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: formData.to,
          subject: formData.subject,
          html: htmlBody,
        },
      });
      if (error) throw error;
      setStatus("success");
      setFormData({ to: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-dashboard">
      {/* MAIN CONTENT AREA */}
      <div className="email-card">
        {/* TABS */}
        <div className="email-tabs">
          <button
            onClick={() => setActiveTab("compose")}
            className={`email-tab-btn ${activeTab === "compose" ? "active" : ""}`}
          >
            <Send size={16} /> Compose
          </button>
          <button
            onClick={() => setActiveTab("inbox")}
            className={`email-tab-btn ${activeTab === "inbox" ? "active" : ""}`}
          >
            <Inbox size={16} /> Inbox
          </button>
        </div>

        {/* --- CONTENT --- */}
        <div className="email-content-area">
          {activeTab === "compose" && (
            <form onSubmit={handleSend} className="compose-form">
              {status === "success" && (
                <div className="status-msg success">
                  <CheckCircle size={20} /> Sent Successfully!
                </div>
              )}
              {status === "error" && (
                <div className="status-msg error">
                  <AlertCircle size={20} /> Error sending email.
                </div>
              )}

              <div className="form-group">
                <label>To</label>
                <input
                  type="email"
                  required
                  className="email-input"
                  value={formData.to}
                  onChange={(e) =>
                    setFormData({ ...formData, to: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  required
                  className="email-input"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Message</label>
                <textarea
                  required
                  className="email-input email-textarea"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>
              <div className="form-actions">
                <button disabled={loading} className="send-btn">
                  {loading ? <Loader2 className="spin" /> : <Send size={18} />}{" "}
                  Send Email
                </button>
              </div>
            </form>
          )}

          {activeTab === "inbox" && (
            <>
              {selectedMessage ? (
                // --- DETAIL VIEW (READING PANE) ---
                <div className="message-detail">
                  {/* Header Actions */}
                  <div className="detail-header-actions">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="back-btn"
                    >
                      <ArrowLeft size={18} /> Back to Inbox
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(selectedMessage.id)}
                        className="delete-btn-icon"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Email Metadata */}
                  <div className="message-meta">
                    <h2 className="meta-subject">{selectedMessage.subject}</h2>

                    <div className="meta-info">
                      <div className="sender-info">
                        <div className="avatar">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="sender-name">
                            {selectedMessage.sender}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            From
                          </div>
                        </div>
                      </div>

                      <div className="timestamp">
                        <Calendar size={14} />
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="message-body">
                    {selectedMessage.body_html ? (
                      <div
                        className="prose max-w-none font-sans email-content"
                        dangerouslySetInnerHTML={{
                          __html: selectedMessage.body_html,
                        }}
                      />
                    ) : (
                      <div className="prose max-w-none whitespace-pre-wrap font-sans">
                        {selectedMessage.body_text ||
                          "No text content available."}
                      </div>
                    )}
                  </div>

                  {/* Reply Button */}
                  <div className="reply-actions">
                    <button
                      onClick={() => handleReply(selectedMessage)}
                      className="reply-btn"
                    >
                      <Reply size={18} /> Reply
                    </button>
                  </div>
                </div>
              ) : (
                // --- LIST VIEW ---
                <>
                  <div className="inbox-toolbar">
                    <h3>
                      <Inbox size={16} /> All Messages
                    </h3>
                    <button
                      onClick={fetchInbox}
                      className="refresh-btn"
                      title="Refresh"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  {/* Empty State */}
                  {!loading && inboxMessages.length === 0 && (
                    <div className="empty-state">
                      <Inbox
                        size={48}
                        style={{ opacity: 0.2, marginBottom: "1rem" }}
                      />
                      <p>No messages yet.</p>
                    </div>
                  )}

                  {/* Loading State */}
                  {loading && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "3rem",
                        color: "#0074d4",
                      }}
                    >
                      <Loader2 className="spin" size={32} />
                    </div>
                  )}

                  {/* Message List */}
                  <ul className="message-list">
                    {inboxMessages.map((msg) => (
                      <li
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className="message-item"
                      >
                        {/* Avatar */}
                        <div className="avatar">
                          {msg.sender.charAt(0).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="msg-preview">
                          <div className="msg-header">
                            <span className="sender-name">{msg.sender}</span>
                            <span className="msg-date">
                              {new Date(msg.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="msg-subject">
                            {msg.subject || "(No Subject)"}
                          </h4>
                          <p className="msg-snippet">{msg.body_text}</p>
                        </div>

                        {/* Hover Actions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(msg.id);
                          }}
                          className="delete-btn-icon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* SIDEBAR INFO */}
      <div className="email-sidebar">
        <div className="info-card dark">
          <h4 className="info-title">
            <Mail className="text-blue-400" /> Email System
          </h4>
          <p className="info-text">
            <strong>Send:</strong> Processed via Resend API.
            <br />
            <strong>Receive:</strong> Emails sent to{" "}
            <em>info@melbournepeptides.com.au</em> appear here instantly.
          </p>
        </div>

        <div className="info-card light">
          <h4 className="info-title" style={{ color: "#0f172a" }}>
            Pro Tip
          </h4>
          <p className="info-text" style={{ color: "#64748b" }}>
            When you click <strong>Reply</strong>, the system automatically
            quotes the original message and sets the subject line for you.
          </p>
        </div>
      </div>
    </div>
  );
}
