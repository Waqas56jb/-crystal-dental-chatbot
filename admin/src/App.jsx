import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://crystal-dental-chatbot-backend.vercel.app";

const pageTitles = {
  dashboard: ["Dashboard", "Live Supabase insights"],
  appointments: ["Appointments", "Chatbot booking requests and confirmations"],
  conversations: ["Conversations", "All real user interactions"],
  knowledge: ["Knowledge Base", "Database-driven chatbot knowledge"],
  analytics: ["Analytics", "Daily, weekly and monthly metrics"],
  languages: ["Languages", "Manage multilingual support"],
  services: ["Services & Pricing", "Manage services database"],
  settings: ["Chatbot Settings", "Behavior and model settings"],
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [overview, setOverview] = useState(null);
  const [leads, setLeads] = useState([]);
  const [insights, setInsights] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [services, setServices] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [settings, setSettings] = useState({});
  const [openAiKeyInput, setOpenAiKeyInput] = useState("");
  const [contextText, setContextText] = useState("");
  const [kbSearch, setKbSearch] = useState("");
  const [kbCategory, setKbCategory] = useState("all");
  const [convFilter, setConvFilter] = useState("all");
  const [form, setForm] = useState({ question: "", category: "general", answer_en: "", answer_hu: "", answer_fr: "" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [isSettingsEditing, setIsSettingsEditing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [o, i, k, s, l, st, c, leadsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/overview`).then((r) => r.json()),
        fetch(`${API_BASE}/api/insights`).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/knowledge`).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/services`).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/languages`).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/settings`).then((r) => r.json()),
        fetch(`${API_BASE}/api/admin/context`).then((r) => r.json()),
        fetch(`${API_BASE}/api/leads`).then((r) => r.json()),
      ]);
      setOverview(o);
      setInsights(i.insights || []);
      setKnowledge(k.knowledge || []);
      setServices(s.services || []);
      setLanguages(l.languages || []);
      setSettings(st.settings || {});
      setOpenAiKeyInput(st?.settings?.openai_api_key || "");
      setContextText(c?.context?.context_text || "");
      setLeads(leadsRes?.leads || []);
    } catch {
      showToast("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const filteredInsights = useMemo(
    () => insights.filter((r) => convFilter === "all" || (r.intent_label || "other") === convFilter),
    [insights, convFilter]
  );

  const filteredKnowledge = useMemo(() => {
    const q = kbSearch.toLowerCase();
    return knowledge.filter((k) => {
      const catOk = kbCategory === "all" || k.category === kbCategory;
      const txt = `${k.question} ${k.answer_en || ""} ${k.answer_hu || ""} ${k.answer_fr || ""}`.toLowerCase();
      return catOk && (!q || txt.includes(q));
    });
  }, [knowledge, kbCategory, kbSearch]);

  const settingsPreview = useMemo(() => {
    const next = { ...(settings || {}) };
    if (next.openai_api_key) {
      next.openai_api_key = "******** (hidden)";
    }
    return next;
  }, [settings]);

  const analyticsData = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      return {
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0,
      };
    });

    const intentCounts = {};
    const urgencyCounts = { low: 0, medium: 0, high: 0 };
    const languageCounts = { EN: 0, HU: 0, FR: 0, OTHER: 0 };
    const serviceCounts = {};
    let bookingCount = 0;
    let topicAllowedCount = 0;

    for (const row of insights) {
      const created = row.created_at ? new Date(row.created_at) : null;
      const createdKey = created ? created.toISOString().slice(0, 10) : "";
      const daySlot = days.find((d) => d.key === createdKey);
      if (daySlot) daySlot.count += 1;

      const intent = (row.intent_label || "other").toLowerCase();
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;

      const urgency = (row.urgency_level || "low").toLowerCase();
      if (urgencyCounts[urgency] !== undefined) urgencyCounts[urgency] += 1;

      const lang = String(row.language_used || "").toUpperCase();
      if (lang.startsWith("EN")) languageCounts.EN += 1;
      else if (lang.startsWith("HU")) languageCounts.HU += 1;
      else if (lang.startsWith("FR")) languageCounts.FR += 1;
      else languageCounts.OTHER += 1;

      const service = row.suggested_service_primary || "Consultation";
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;

      if (row.booking_intent) bookingCount += 1;
      if (row.topic_allowed) topicAllowedCount += 1;
    }

    const totalInsights = insights.length || 1;
    const bookingRate = (bookingCount / totalInsights) * 100;
    const topicAllowedRate = (topicAllowedCount / totalInsights) * 100;

    const topServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const topIntents = Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      days,
      topServices,
      topIntents,
      urgencyCounts,
      languageCounts,
      bookingRate,
      topicAllowedRate,
      totalInsights: insights.length,
    };
  }, [insights]);

  const saveKnowledge = async () => {
    if (!form.question.trim() || !form.answer_en.trim()) return showToast("Question and English answer required");
    const res = await fetch(`${API_BASE}/api/admin/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return showToast("Failed to save knowledge");
    setForm({ question: "", category: "general", answer_en: "", answer_hu: "", answer_fr: "" });
    showToast("Knowledge saved");
    await loadAll();
  };

  const deleteKnowledge = async (id) => {
    if (!window.confirm("Delete this row?")) return;
    const res = await fetch(`${API_BASE}/api/admin/knowledge/${id}`, { method: "DELETE" });
    if (!res.ok) return showToast("Delete failed");
    showToast("Knowledge deleted");
    await loadAll();
  };

  const saveContext = async () => {
    const res = await fetch(`${API_BASE}/api/admin/context`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context_name: "default", context_text: contextText }),
    });
    if (!res.ok) return showToast("Failed to save context");
    showToast("Context saved");
  };

  const saveServices = async () => {
    const res = await fetch(`${API_BASE}/api/admin/services`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services }),
    });
    if (!res.ok) return showToast("Failed to save services");
    showToast("Services saved");
    await loadAll();
  };

  const saveLanguages = async () => {
    const res = await fetch(`${API_BASE}/api/admin/languages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languages }),
    });
    if (!res.ok) return showToast("Failed to save languages");
    showToast("Languages saved");
    await loadAll();
  };

  const saveSettings = async () => {
    const nextSettings = { ...settings };
    // Do not accidentally clear saved OpenAI key during generic settings save.
    if (openAiKeyInput) {
      nextSettings.openai_api_key = openAiKeyInput;
    } else if (settings.openai_api_key) {
      nextSettings.openai_api_key = settings.openai_api_key;
    }
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: nextSettings }),
    });
    if (!res.ok) return showToast("Failed to save settings");
    showToast("Settings saved");
    setIsSettingsEditing(false);
  };

  const updateLeadStatus = async (leadId, status) => {
    const res = await fetch(`${API_BASE}/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return showToast("Failed to update appointment status");
    showToast(`Appointment marked as ${status}`);
    await loadAll();
  };

  const saveOpenAiKey = async () => {
    if (!openAiKeyInput.trim()) return showToast("OpenAI key is required");
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { openai_api_key: openAiKeyInput.trim() } }),
    });
    if (!res.ok) return showToast("Failed to save OpenAI key");
    setSettings((prev) => ({ ...prev, openai_api_key: openAiKeyInput.trim() }));
    showToast("OpenAI key saved permanently");
    setIsSettingsEditing(false);
  };

  const clearOpenAiKey = async () => {
    if (!window.confirm("Remove saved OpenAI fallback key?")) return;
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { openai_api_key: "" } }),
    });
    if (!res.ok) return showToast("Failed to clear OpenAI key");
    setOpenAiKeyInput("");
    setSettings((prev) => ({ ...prev, openai_api_key: "" }));
    showToast("OpenAI key cleared");
  };

  const totals = overview?.totals || {};
  const pageMeta = pageTitles[activeTab];
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 900 : false;

  return (
    <div className="app-shell">
      <nav id="sidebar" className={isSidebarOpen ? "open" : ""}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🦷</div>
          <span className="sidebar-logo-text">Denta<span>Lux</span></span>
          <span className="sidebar-badge">Admin</span>
        </div>
        <div className="sidebar-section">Main Menu</div>
        <div className="sidebar-nav">
          {["dashboard", "appointments", "conversations", "knowledge", "analytics", "languages", "services", "settings"].map((k) => (
            <button
              key={k}
              className={`nav-item ${activeTab === k ? "active" : ""}`}
              onClick={() => {
                setActiveTab(k);
                if (isMobile) setIsSidebarOpen(false);
              }}
            >
              <span className="nav-icon">•</span>{k}
            </button>
          ))}
        </div>
      </nav>
      {isSidebarOpen ? <button className="mobile-backdrop" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu" /> : null}

      <div id="main">
        <div className="topbar">
          <button className="menu-btn" onClick={() => setIsSidebarOpen((v) => !v)} aria-label="Toggle sidebar menu">☰</button>
          <div>
            <div className="topbar-title">{pageMeta[0]}</div>
            <div className="topbar-sub">{pageMeta[1]}</div>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" onClick={() => void loadAll()}>Refresh</button>
          </div>
        </div>
        <div className="content">
          {loading ? <div className="card"><div className="card-body">Loading...</div></div> : null}

          {activeTab === "dashboard" ? (
            <div className="stats-row">
              <Stat icon="👥" color="green" num={totals.visitorsDaily || 0} label="Daily Visitors" />
              <Stat icon="📅" color="gold" num={totals.appointments || 0} label="Appointments" />
              <Stat icon="💬" color="blue" num={totals.sessions || 0} label="Sessions" />
              <Stat icon="⭐" color="orange" num={totals.avgReview || "0.0"} label="Avg Review" />
            </div>
          ) : null}

          {activeTab === "appointments" ? (
            <div className="card">
              <div className="card-header"><div className="card-title">Appointments from Chatbot</div></div>
              <div style={{ overflowX: "auto" }}>
                <table className="conv-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Phone</th><th>Email</th><th>Service</th><th>Date</th><th>Notes</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr><td colSpan={8} style={{ color: "var(--muted)" }}>No chatbot appointments yet.</td></tr>
                    ) : null}
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td>{lead.full_name || "-"}</td>
                        <td>{lead.phone || "-"}</td>
                        <td>{lead.email || "-"}</td>
                        <td>{lead.preferred_service || "-"}</td>
                        <td>{lead.preferred_date || "-"}</td>
                        <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.notes || "-"}</td>
                        <td><span className={`status-pill ${lead.status === "confirmed" ? "booked" : "pending"}`}>{lead.status || "new"}</span></td>
                        <td>
                          <button
                            className="card-action"
                            disabled={lead.status === "confirmed"}
                            onClick={() => void updateLeadStatus(lead.id, "confirmed")}
                          >
                            Confirm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "conversations" ? <InsightsTable rows={filteredInsights} /> : null}

          {activeTab === "knowledge" ? (
            <>
              <div className="add-kb-form">
                <h3>Add Knowledge</h3>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Question</label><input className="form-input" value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} /></div>
                  <div className="form-group full"><label className="form-label">Answer EN</label><textarea className="form-textarea" value={form.answer_en} onChange={(e) => setForm((p) => ({ ...p, answer_en: e.target.value }))} /></div>
                </div>
                <button className="form-submit" onClick={() => void saveKnowledge()}>Save Knowledge</button>
              </div>

              <div className="add-kb-form">
                <h3>Global Prompt Context</h3>
                <textarea className="form-textarea" style={{ minHeight: 120 }} value={contextText} onChange={(e) => setContextText(e.target.value)} />
                <button className="form-submit" onClick={() => void saveContext()}>Save Context</button>
              </div>

              <div className="kb-toolbar">
                <input className="kb-search" placeholder="Search knowledge..." value={kbSearch} onChange={(e) => setKbSearch(e.target.value)} />
                {["all", "pricing", "symptom", "booking", "service", "general"].map((c) => (
                  <button key={c} className={`filter-btn ${kbCategory === c ? "active" : ""}`} onClick={() => setKbCategory(c)}>{c}</button>
                ))}
              </div>
              <div className="kb-grid">
                {filteredKnowledge.map((k) => (
                  <div className="kb-item" key={k.id}>
                    <div>
                      <div className="kb-q">{k.question}</div>
                      <div className="kb-a">{k.answer_en}</div>
                    </div>
                    <div className="kb-actions"><button className="kb-del" onClick={() => void deleteKnowledge(k.id)}>🗑</button></div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {activeTab === "analytics" ? (
            <>
              <div className="stats-row">
                <Stat icon="📊" color="blue" num={analyticsData.totalInsights} label="Total Insight Events" />
                <Stat icon="📅" color="gold" num={`${analyticsData.bookingRate.toFixed(1)}%`} label="Booking Intent Rate" />
                <Stat icon="✅" color="green" num={`${analyticsData.topicAllowedRate.toFixed(1)}%`} label="In-scope Query Rate" />
                <Stat icon="👥" color="orange" num={totals.visitorsMonthly || 0} label="Monthly Visitors" />
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><div className="card-title">📈 7-Day Conversation Trend</div></div>
                  <div className="card-body">
                    <div className="chart-bars">
                      {analyticsData.days.map((d) => {
                        const max = Math.max(...analyticsData.days.map((x) => x.count), 1);
                        const height = Math.max(8, Math.round((d.count / max) * 100));
                        return (
                          <div key={d.key} className="bar-group">
                            <div className="bar-wrap"><div className="bar" style={{ height: `${height}%` }} /></div>
                            <div className="bar-label">{d.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><div className="card-title">🌍 Language Mix</div></div>
                  <div className="card-body">
                    {Object.entries(analyticsData.languageCounts).map(([lang, count]) => (
                      <div key={lang} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span>{lang}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><div className="card-title">🎯 Top Requested Services</div></div>
                  <div className="card-body">
                    {analyticsData.topServices.length === 0 ? <p style={{ color: "var(--muted)" }}>No service insight data yet.</p> : null}
                    {analyticsData.topServices.map(([name, count]) => (
                      <MetricRow key={name} label={name} value={count} total={analyticsData.totalInsights} />
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><div className="card-title">🧠 Intent Breakdown</div></div>
                  <div className="card-body">
                    {analyticsData.topIntents.length === 0 ? <p style={{ color: "var(--muted)" }}>No intent data yet.</p> : null}
                    {analyticsData.topIntents.map(([intent, count]) => (
                      <MetricRow key={intent} label={intent} value={count} total={analyticsData.totalInsights} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">🚨 Urgency Distribution</div></div>
                <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                  <UrgencyCard label="Low" count={analyticsData.urgencyCounts.low} color="var(--green)" />
                  <UrgencyCard label="Medium" count={analyticsData.urgencyCounts.medium} color="var(--orange)" />
                  <UrgencyCard label="High" count={analyticsData.urgencyCounts.high} color="var(--red)" />
                </div>
              </div>
            </>
          ) : null}

          {activeTab === "languages" ? (
            <div className="card">
              <div className="card-header"><div className="card-title">Languages</div><button className="card-action" onClick={() => void saveLanguages()}>Save</button></div>
              <div className="card-body">
                {languages.length === 0 ? <p style={{ color: "var(--muted)" }}>No language rows found.</p> : null}
                {languages.map((l) => (
                  <div className="setting-row" key={l.code}>
                    <div className="setting-info">
                      <div className="setting-name">{l.label}</div>
                      <div className="setting-desc">{l.code} · traffic {l.traffic_percent}%</div>
                    </div>
                    <button className={`toggle ${l.enabled ? "on" : ""}`} onClick={() => setLanguages((prev) => prev.map((x) => (x.code === l.code ? { ...x, enabled: !x.enabled } : x)))} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "services" ? (
            <div className="card">
              <div className="card-header"><div className="card-title">Services & Pricing</div><button className="card-action" onClick={() => void saveServices()}>Save</button></div>
              <div style={{ overflowX: "auto" }}>
                <table className="conv-table">
                  <thead><tr><th>Name</th><th>Price</th><th>Duration</th><th>Active</th></tr></thead>
                  <tbody>
                    {services.length === 0 ? (
                      <tr><td colSpan={4} style={{ color: "var(--muted)" }}>No services rows found.</td></tr>
                    ) : null}
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td><input className="form-input" value={s.price_from || ""} onChange={(e) => setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, price_from: e.target.value } : x)))} /></td>
                        <td><input className="form-input" value={s.duration || ""} onChange={(e) => setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, duration: e.target.value } : x)))} /></td>
                        <td><button className={`toggle ${s.is_active ? "on" : ""}`} onClick={() => setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Settings</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!isSettingsEditing ? (
                    <button className="card-action" onClick={() => setIsSettingsEditing(true)}>Edit</button>
                  ) : (
                    <>
                      <button className="card-action" onClick={() => void saveSettings()}>Save</button>
                      <button className="card-action" onClick={() => { setIsSettingsEditing(false); void loadAll(); }}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body">
                <pre style={{ whiteSpace: "pre-wrap", color: "var(--cream)", marginBottom: 16 }}>
                  {JSON.stringify(settingsPreview, null, 2)}
                </pre>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    className="form-input"
                    value={settings.chatbot_config?.model || ""}
                    disabled={!isSettingsEditing}
                    onChange={(e) => setSettings((prev) => ({ ...prev, chatbot_config: { ...(prev.chatbot_config || {}), model: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Booking Contact</label>
                  <input
                    className="form-input"
                    value={settings.chatbot_config?.booking_contact || ""}
                    disabled={!isSettingsEditing}
                    onChange={(e) => setSettings((prev) => ({ ...prev, chatbot_config: { ...(prev.chatbot_config || {}), booking_contact: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">OpenAI API Key (Fallback)</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="sk-... (used when server env key is missing)"
                    value={openAiKeyInput}
                    disabled={!isSettingsEditing}
                    onChange={(e) => setOpenAiKeyInput(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="card-action" disabled={!isSettingsEditing} onClick={() => void saveOpenAiKey()}>
                      Save OpenAI Key
                    </button>
                    <button className="card-action" disabled={!isSettingsEditing} onClick={() => void clearOpenAiKey()}>
                      Clear OpenAI Key
                    </button>
                  </div>
                  <small style={{ color: "var(--muted)" }}>
                    Saved in database. It stays after refresh/login/logout and is used automatically when env key is missing.
                  </small>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div id="toast" className={toast ? "show" : ""}>✅ <span>{toast}</span></div>
    </div>
  );
}

function Stat({ icon, color, num, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-num">{num}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function InsightsTable({ rows }) {
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">Insights</div></div>
      <div style={{ overflowX: "auto" }}>
        <table className="conv-table">
          <thead><tr><th>Session</th><th>Message</th><th>Lang</th><th>Intent</th><th>Service</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.session_id?.slice(0, 12)}</td>
                <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.user_message}</td>
                <td>{r.language_used}</td>
                <td>{r.intent_label}</td>
                <td>{r.suggested_service_primary || "-"}</td>
                <td><span className={`status-pill ${r.booking_intent ? "booked" : r.topic_allowed ? "resolved" : "pending"}`}>{r.booking_intent ? "booked" : r.topic_allowed ? "resolved" : "pending"}</span></td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricRow({ label, value, total }) {
  const pct = total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={{ height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(to right,var(--gold-dark),var(--gold))", borderRadius: 4 }} />
      </div>
    </div>
  );
}

function UrgencyCard({ label, count, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color }}>{count}</div>
    </div>
  );
}
