const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const PORT = Number(process.env.PORT || 8080);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_MEMORY_MESSAGES = 40; // 20 user prompts + 20 assistant replies
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Set both in backend/.env");
}

const app = express();
const openAiClients = new Map();
const ENV_OPENAI_API_KEY = cleanText(process.env.OPENAI_API_KEY || "");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const sessions = new Map();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

const servicesCatalog = [
  { name: "Teeth Whitening", fromPrice: "EUR 120", notes: "Laser whitening up to 10 shades." },
  { name: "Porcelain Veneers", fromPrice: "EUR 350 per tooth", notes: "Cosmetic smile transformation." },
  { name: "Dental Implants", fromPrice: "EUR 800", notes: "Permanent tooth replacement solution." },
  { name: "Orthodontics", fromPrice: "EUR 1200", notes: "Aligners or braces for alignment." },
  { name: "Emergency Care", fromPrice: "EUR 80", notes: "Same-day pain and urgent care." },
  { name: "Smile Makeover", fromPrice: "EUR 2500", notes: "Combined full smile plan." },
  { name: "Consultation", fromPrice: "Free", notes: "Initial assessment and treatment guidance." },
];

const supportedLanguages = ["English", "Hungarian", "French"];
const allowedTopics = [
  "Dental symptoms triage",
  "Dental services and pricing",
  "Appointment and booking help",
  "Clinic availability and contact guidance",
  "Language support for EN/HU/FR",
];

const DEFAULT_CONTEXT_TEXT =
  "DentaLux Clinic context: multilingual dental assistant, approved services, pricing transparency, emergency triage, and booking guidance.";

function ensureSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      memory: [],
      leadDraft: {
        fullName: "",
        email: "",
        phone: "",
        preferredService: "",
        preferredDate: "",
        notes: "",
      },
    });
  }
  return sessions.get(sessionId);
}

function mapLanguageCode(codeOrLabel) {
  const value = String(codeOrLabel || "").toLowerCase();
  if (value.startsWith("hu")) return "Hungarian";
  if (value.startsWith("fr")) return "French";
  return "English";
}

function mapShortLanguage(codeOrLabel) {
  const value = String(codeOrLabel || "").toLowerCase();
  if (value.startsWith("hu")) return "HU";
  if (value.startsWith("fr")) return "FR";
  return "EN";
}

function makeSystemPrompt(languageHint = "auto", adminContext = DEFAULT_CONTEXT_TEXT, knowledgeEntries = []) {
  return `
You are "DentaLux AI Assistant", an advanced, patient-friendly dental clinic assistant.

MISSION:
- Provide smart, concise, trustworthy guidance for dental clinic users.
- Suggest relevant clinic services from the approved service catalog.
- Help users complete booking requests and capture lead details.
- Stay multilingual and answer in user language (English/Hungarian/French).

STRICT DOMAIN BOUNDARY (CRITICAL):
- ONLY handle these topics:
  1) Dental symptoms and likely service direction
  2) Dental service explanations and prices
  3) Appointment booking flow and lead collection
  4) Basic clinic contact/availability support
  5) Language handling EN/HU/FR
- If user asks anything outside this domain (finance, coding, politics, general trivia, etc),
  politely refuse and redirect to dental service/booking help.

SUPPORTED LANGUAGES:
- Primary: English, Hungarian, French.
- Auto-detect language from user text and reply in that same language.
- If mixed language, ask one short clarifying question and continue in user's preferred language.
- Keep terminology accurate and professional for dental context.

BOOKING + LEAD FLOW:
- If user shows booking intent or urgent symptom, guide them step-by-step.
- Collect these fields naturally over conversation:
  fullName, phone or email (at least one), preferredService, preferredDate (optional), notes.
- Do NOT ask all fields at once; ask 1-2 concise questions at a time.
- Once minimum lead data is present (name + phone/email), encourage final confirmation.
- If user refuses details, still provide contact fallback and keep conversation friendly.

SERVICE MATCHING RULES:
- Map symptom intent to one best-fit service and one backup service.
- Prioritize urgency for pain/swelling/bleeding/trauma -> Emergency Care.
- Cosmetic intent -> Whitening / Veneers / Smile Makeover.
- Alignment concerns -> Orthodontics.
- Missing tooth concerns -> Implants.
- Unclear symptom -> Consultation.
- Never invent services that are not in catalog.
- Use provided "from" pricing only. Never fabricate discounts/guarantees.

SAFETY + MEDICAL DISCLAIMER STYLE:
- You are not a doctor and do not diagnose with certainty.
- For severe pain, swelling, bleeding, fever, trauma: advise urgent clinic visit.
- Keep safety statement short and calm; avoid fear language.

TONE:
- Warm, professional, conversion-friendly, concise, and human.
- Avoid robotic repetition.
- Prefer practical next action at end of each reply.

OUTPUT FORMAT REQUIREMENT:
- You MUST respond with strict JSON only (no markdown) using keys:
  {
    "reply": "string for user",
    "topic_allowed": true|false,
    "language_used": "English|Hungarian|French",
    "suggested_service_primary": "string",
    "suggested_service_secondary": "string",
    "booking_intent": true|false,
    "intent_label": "booking|pricing|symptom|support|feedback|review|other",
    "urgency_level": "low|medium|high",
    "sentiment": "positive|neutral|negative",
    "lead_update": {
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "preferredService": "string",
      "preferredDate": "string",
      "notes": "string"
    },
    "next_question": "string"
  }
- "lead_update" should include only values user provided in latest message; otherwise empty strings.
- If topic not allowed: topic_allowed=false, give polite redirect in "reply", and short "next_question".

RUNTIME CONTEXT:
- Language hint from frontend: ${languageHint}
- Supported languages: ${supportedLanguages.join(", ")}
- Allowed topics: ${allowedTopics.join(" | ")}
- Admin context (must prioritize this): ${adminContext}
- Service catalog:
${servicesCatalog.map((s) => `  - ${s.name}: ${s.fromPrice}. ${s.notes}`).join("\n")}
- Knowledge base snippets:
${knowledgeEntries.length ? knowledgeEntries.map((k) => `  - [${k.category}] Q: ${k.question} | EN: ${k.answer_en}`).join("\n") : "  - No custom knowledge rows yet."}
`;
}

function cleanText(input) {
  return typeof input === "string" ? input.trim() : "";
}

function isOpenAiQuotaError(error) {
  const detail = String(error?.message || "").toLowerCase();
  const status = Number(error?.status || error?.code || 0);
  return status === 429 || detail.includes("quota") || detail.includes("billing") || detail.includes("rate limit");
}

function isOpenAiKeyError(error) {
  const detail = String(error?.message || "").toLowerCase();
  const status = Number(error?.status || error?.code || 0);
  return status === 401 || status === 403 || detail.includes("invalid api key") || detail.includes("incorrect api key");
}

function getOpenAiClient(apiKey) {
  const safeKey = cleanText(apiKey);
  if (!safeKey) return null;
  if (!openAiClients.has(safeKey)) {
    openAiClients.set(safeKey, new OpenAI({ apiKey: safeKey }));
  }
  return openAiClients.get(safeKey);
}

async function getOpenAiApiKeyFromSettings() {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "openai_api_key")
    .maybeSingle();
  if (error) throw error;
  return cleanText(data?.value || "");
}

async function resolveOpenAiClient() {
  if (ENV_OPENAI_API_KEY) {
    return { client: getOpenAiClient(ENV_OPENAI_API_KEY), source: "env" };
  }
  const adminKey = await getOpenAiApiKeyFromSettings();
  if (adminKey) {
    return { client: getOpenAiClient(adminKey), source: "admin_settings" };
  }
  return { client: null, source: "missing" };
}

function mergeLeadDraft(current, patch) {
  const next = { ...current };
  for (const key of Object.keys(next)) {
    if (patch && typeof patch[key] === "string" && patch[key].trim()) {
      next[key] = patch[key].trim();
    }
  }
  return next;
}

function hasMinimalLead(lead) {
  return Boolean(lead.fullName && (lead.phone || lead.email));
}

async function ensureSessionRow(sessionId, languageHint) {
  const { error } = await supabase.from("chat_sessions").upsert(
    {
      session_id: sessionId,
      language_hint: mapLanguageCode(languageHint),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "session_id" }
  );
  if (error) throw error;
}

async function saveMessages(sessionId, userText, assistantText, language) {
  const rows = [
    { session_id: sessionId, role: "user", content: userText, language },
    { session_id: sessionId, role: "assistant", content: assistantText, language },
  ];
  const { error } = await supabase.from("chat_messages").insert(rows);
  if (error) throw error;
}

async function saveLeadRecord(lead, sessionId) {
  const { error } = await supabase.from("chat_leads").insert({
    session_id: sessionId,
    full_name: lead.fullName,
    email: lead.email || null,
    phone: lead.phone || null,
    preferred_service: lead.preferredService || null,
    preferred_date: lead.preferredDate || null,
    notes: lead.notes || null,
    status: "new",
    source: "chatbot",
  });
  if (error) throw error;
}

async function saveInsightRecord({
  sessionId,
  userMessage,
  reply,
  topicAllowed,
  intentLabel,
  urgencyLevel,
  sentiment,
  bookingIntent,
  suggestedPrimary,
  suggestedSecondary,
  languageUsed,
}) {
  const { error } = await supabase.from("chat_insights").insert({
    session_id: sessionId,
    user_message: userMessage,
    bot_reply: reply,
    topic_allowed: topicAllowed,
    intent_label: intentLabel || "other",
    urgency_level: urgencyLevel || "low",
    sentiment: sentiment || "neutral",
    booking_intent: bookingIntent,
    suggested_service_primary: suggestedPrimary || null,
    suggested_service_secondary: suggestedSecondary || null,
    language_used: mapLanguageCode(languageUsed),
  });
  if (error) throw error;
}

async function getActiveAdminContext() {
  const { data, error } = await supabase
    .from("chatbot_context")
    .select("context_text")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.context_text || DEFAULT_CONTEXT_TEXT;
}

async function getKnowledgeForPrompt(limit = 20) {
  const { data, error } = await supabase
    .from("admin_knowledge")
    .select("question,category,answer_en")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function getOverviewStats() {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [sessionsRes, leadsRes, feedbackRes, reviewsRes, insightsRes] = await Promise.all([
    supabase.from("chat_sessions").select("session_id,created_at,last_seen_at", { count: "exact" }),
    supabase.from("chat_leads").select("*", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("chat_feedback").select("rating,created_at", { count: "exact" }),
    supabase.from("chat_reviews").select("stars,created_at", { count: "exact" }),
    supabase.from("chat_insights").select("intent_label,language_used,suggested_service_primary,created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(1000),
  ]);

  for (const result of [sessionsRes, leadsRes, feedbackRes, reviewsRes, insightsRes]) {
    if (result.error) throw result.error;
  }

  const sessions = sessionsRes.data || [];
  const leads = leadsRes.data || [];
  const feedback = feedbackRes.data || [];
  const reviews = reviewsRes.data || [];
  const insights = insightsRes.data || [];

  const dailyVisitors = sessions.filter((s) => (s.last_seen_at || s.created_at) >= dayAgo).length;
  const weeklyVisitors = sessions.filter((s) => (s.last_seen_at || s.created_at) >= weekAgo).length;
  const monthlyVisitors = sessions.filter((s) => (s.last_seen_at || s.created_at) >= monthAgo).length;

  const monthlyLeads = leads.filter((l) => l.created_at >= monthAgo).length;
  const avgFeedback =
    feedback.length > 0 ? (feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.length).toFixed(1) : "0.0";
  const avgReview =
    reviews.length > 0 ? (reviews.reduce((sum, item) => sum + Number(item.stars || 0), 0) / reviews.length).toFixed(1) : "0.0";

  const langCounts = insights.reduce((acc, i) => {
    const key = mapShortLanguage(i.language_used);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const serviceCounts = insights.reduce((acc, i) => {
    const key = i.suggested_service_primary || "Consultation";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totals: {
      visitorsDaily: dailyVisitors,
      visitorsWeekly: weeklyVisitors,
      visitorsMonthly: monthlyVisitors,
      sessions: sessionsRes.count || sessions.length,
      appointments: leadsRes.count || leads.length,
      avgFeedback,
      avgReview,
    },
    languageDistribution: langCounts,
    serviceDistribution: serviceCounts,
    latestLeads: leads.slice(0, 20),
    latestInsights: insights.slice(0, 50),
  };
}

async function logDatabaseConnectionStatus() {
  const safeUrl = SUPABASE_URL.replace(/^https?:\/\//, "");
  try {
    const { error } = await supabase.from("chat_sessions").select("id").limit(1);
    if (error) {
      console.error(`[DB] Supabase reachable but query failed: ${error.message}`);
      console.error("[DB] Check that schema.sql is executed and tables exist.");
      return;
    }
    console.log(`[DB] Connected to Supabase: ${safeUrl}`);
    console.log("[DB] chat_sessions table query check: OK");
  } catch (error) {
    console.error(`[DB] Supabase connection failed: ${error.message}`);
  }
}

async function getModelJsonResponse({ openaiClient, languageHint, memory, message, adminContext, knowledgeEntries }) {
  const completion = await openaiClient.chat.completions.create({
    model: MODEL,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: makeSystemPrompt(languageHint, adminContext, knowledgeEntries) },
      ...memory,
      { role: "user", content: message },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || "{}";
  return JSON.parse(text);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "dental-chatbot-backend",
    model: MODEL,
    database: "supabase",
  });
});

app.get("/api/leads", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("chat_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const leads = data || [];
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ error: "Failed to load leads", detail: error.message });
  }
});

app.patch("/api/leads/:id/status", async (req, res) => {
  try {
    const id = cleanText(req.params?.id);
    const status = cleanText(req.body?.status || "confirmed").toLowerCase();
    const allowed = new Set(["new", "confirmed", "cancelled", "completed"]);
    if (!id) return res.status(400).json({ error: "Lead id is required" });
    if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status value" });
    const { data, error } = await supabase
      .from("chat_leads")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    res.json({ lead: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to update lead status", detail: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const sessionId = cleanText(req.body?.sessionId) || "default-session";
    const message = cleanText(req.body?.message);
    const languageHint = cleanText(req.body?.language) || "auto";

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const session = ensureSession(sessionId);
    await ensureSessionRow(sessionId, languageHint);
    const adminKey = await getOpenAiApiKeyFromSettings();
    const envClient = ENV_OPENAI_API_KEY ? getOpenAiClient(ENV_OPENAI_API_KEY) : null;
    const adminClient = adminKey ? getOpenAiClient(adminKey) : null;
    const openaiClient = envClient || adminClient;
    if (!openaiClient) {
      return res.status(500).json({
        error: "OpenAI API key missing",
        detail: "Set OPENAI_API_KEY in environment or configure openai_api_key in Admin Settings.",
      });
    }

    const [adminContext, knowledgeEntries] = await Promise.all([getActiveAdminContext(), getKnowledgeForPrompt(20)]);

    let modelJson;
    try {
      modelJson = await getModelJsonResponse({
        openaiClient,
        languageHint,
        memory: session.memory,
        message,
        adminContext,
        knowledgeEntries,
      });
    } catch (primaryError) {
      const canFallbackToAdmin =
        Boolean(envClient && adminClient) &&
        (isOpenAiQuotaError(primaryError) || isOpenAiKeyError(primaryError));
      if (!canFallbackToAdmin) throw primaryError;
      console.warn("[AI] Env key failed, retrying with admin settings key.");
      modelJson = await getModelJsonResponse({
        openaiClient: adminClient,
        languageHint,
        memory: session.memory,
        message,
        adminContext,
        knowledgeEntries,
      });
    }

    const reply = cleanText(modelJson.reply) || "How can I help you with dental services or booking today?";
    const topicAllowed = Boolean(modelJson.topic_allowed);
    const bookingIntent = Boolean(modelJson.booking_intent);
    const intentLabel = cleanText(modelJson.intent_label) || "other";
    const urgencyLevel = cleanText(modelJson.urgency_level) || "low";
    const sentiment = cleanText(modelJson.sentiment) || "neutral";
    const nextQuestion = cleanText(modelJson.next_question);
    const suggestedPrimary = cleanText(modelJson.suggested_service_primary);
    const suggestedSecondary = cleanText(modelJson.suggested_service_secondary);
    const languageUsed = cleanText(modelJson.language_used) || mapLanguageCode(languageHint);
    const leadUpdate = modelJson.lead_update && typeof modelJson.lead_update === "object" ? modelJson.lead_update : {};

    session.leadDraft = mergeLeadDraft(session.leadDraft, leadUpdate);

    session.memory.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );
    if (session.memory.length > MAX_MEMORY_MESSAGES) {
      session.memory = session.memory.slice(-MAX_MEMORY_MESSAGES);
    }

    await saveMessages(sessionId, message, reply, languageUsed);
    await saveInsightRecord({
      sessionId,
      userMessage: message,
      reply,
      topicAllowed,
      intentLabel,
      urgencyLevel,
      sentiment,
      bookingIntent,
      suggestedPrimary,
      suggestedSecondary,
      languageUsed,
    });

    let leadSaved = false;
    if (bookingIntent && hasMinimalLead(session.leadDraft)) {
      await saveLeadRecord(session.leadDraft, sessionId);
      leadSaved = true;
      session.leadDraft = {
        fullName: "",
        email: "",
        phone: "",
        preferredService: "",
        preferredDate: "",
        notes: "",
      };
    }

    return res.json({
      reply,
      topicAllowed,
      suggestedService: {
        primary: suggestedPrimary,
        secondary: suggestedSecondary,
      },
      bookingIntent,
      nextQuestion,
      leadCaptured: leadSaved,
      insight: {
        intent: intentLabel,
        urgency: urgencyLevel,
        sentiment,
      },
      memory: {
        turnsRemembered: Math.floor(session.memory.length / 2),
        maxTurns: 20,
      },
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    if (isOpenAiQuotaError(error)) {
      return res.json({
        reply:
          "Our AI assistant is temporarily busy due to API quota limits. Please try again shortly, or contact clinic support for immediate booking help.",
        topicAllowed: true,
        suggestedService: { primary: "Consultation", secondary: "Emergency Care" },
        bookingIntent: false,
        nextQuestion: "Would you like us to connect you with human support now?",
        leadCaptured: false,
        insight: { intent: "support", urgency: "medium", sentiment: "neutral" },
        memory: { turnsRemembered: 0, maxTurns: 20 },
        fallback: "openai_quota_exceeded",
      });
    }
    return res.status(500).json({
      error: "Chat processing failed",
      detail: error.message,
    });
  }
});

app.post("/api/chat/feedback", async (req, res) => {
  try {
    const sessionId = cleanText(req.body?.sessionId) || "default-session";
    const rating = Number(req.body?.rating || 0);
    const comment = cleanText(req.body?.comment);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }
    await ensureSessionRow(sessionId, "auto");
    const { error } = await supabase.from("chat_feedback").insert({
      session_id: sessionId,
      rating,
      comment: comment || null,
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save feedback", detail: error.message });
  }
});

app.post("/api/chat/support", async (req, res) => {
  try {
    const sessionId = cleanText(req.body?.sessionId) || "default-session";
    const fullName = cleanText(req.body?.fullName);
    const contact = cleanText(req.body?.contact);
    const issue = cleanText(req.body?.issue);
    const priority = cleanText(req.body?.priority) || "medium";
    if (!issue) return res.status(400).json({ error: "issue is required" });
    await ensureSessionRow(sessionId, "auto");
    const { error } = await supabase.from("chat_support_tickets").insert({
      session_id: sessionId,
      full_name: fullName || null,
      contact: contact || null,
      issue,
      priority,
      status: "open",
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to create support ticket", detail: error.message });
  }
});

app.post("/api/chat/review", async (req, res) => {
  try {
    const sessionId = cleanText(req.body?.sessionId) || "default-session";
    const patientName = cleanText(req.body?.patientName);
    const stars = Number(req.body?.stars || 0);
    const reviewText = cleanText(req.body?.reviewText);
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "stars must be between 1 and 5" });
    }
    if (!reviewText) return res.status(400).json({ error: "reviewText is required" });
    await ensureSessionRow(sessionId, "auto");
    const { error } = await supabase.from("chat_reviews").insert({
      session_id: sessionId,
      patient_name: patientName || "Anonymous",
      stars,
      review_text: reviewText,
      source: "chatbot",
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save review", detail: error.message });
  }
});

app.get("/api/insights", async (req, res) => {
  try {
    const sessionId = cleanText(req.query?.sessionId);
    let query = supabase.from("chat_insights").select("*").order("created_at", { ascending: false }).limit(200);
    if (sessionId) query = query.eq("session_id", sessionId);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ insights: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to load insights", detail: error.message });
  }
});

app.get("/api/admin/overview", async (_req, res) => {
  try {
    const overview = await getOverviewStats();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: "Failed to load overview", detail: error.message });
  }
});

app.get("/api/admin/knowledge", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("admin_knowledge").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    res.json({ knowledge: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to load knowledge", detail: error.message });
  }
});

app.post("/api/admin/knowledge", async (req, res) => {
  try {
    const row = {
      question: cleanText(req.body?.question),
      category: cleanText(req.body?.category) || "general",
      answer_en: cleanText(req.body?.answer_en),
      answer_hu: cleanText(req.body?.answer_hu) || null,
      answer_fr: cleanText(req.body?.answer_fr) || null,
      tags: Array.isArray(req.body?.tags) ? req.body.tags : [],
      is_active: req.body?.is_active !== false,
      updated_at: new Date().toISOString(),
    };
    if (!row.question || !row.answer_en) return res.status(400).json({ error: "question and answer_en are required" });
    const { data, error } = await supabase.from("admin_knowledge").insert(row).select("*").single();
    if (error) throw error;
    res.json({ knowledge: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to create knowledge", detail: error.message });
  }
});

app.patch("/api/admin/knowledge/:id", async (req, res) => {
  try {
    const id = cleanText(req.params?.id);
    const patch = {
      updated_at: new Date().toISOString(),
    };
    const fields = ["question", "category", "answer_en", "answer_hu", "answer_fr", "is_active"];
    for (const f of fields) {
      if (req.body?.[f] !== undefined) patch[f] = typeof req.body[f] === "string" ? cleanText(req.body[f]) : req.body[f];
    }
    if (req.body?.tags !== undefined) patch.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    const { data, error } = await supabase.from("admin_knowledge").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    res.json({ knowledge: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to update knowledge", detail: error.message });
  }
});

app.delete("/api/admin/knowledge/:id", async (req, res) => {
  try {
    const id = cleanText(req.params?.id);
    const { error } = await supabase.from("admin_knowledge").delete().eq("id", id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete knowledge", detail: error.message });
  }
});

app.get("/api/admin/context", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("chatbot_context")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json({ context: data || { context_name: "default", context_text: DEFAULT_CONTEXT_TEXT } });
  } catch (error) {
    res.status(500).json({ error: "Failed to load context", detail: error.message });
  }
});

app.put("/api/admin/context", async (req, res) => {
  try {
    const contextText = cleanText(req.body?.context_text);
    if (!contextText) return res.status(400).json({ error: "context_text is required" });
    await supabase.from("chatbot_context").update({ is_active: false }).eq("is_active", true);
    const { data, error } = await supabase
      .from("chatbot_context")
      .insert({
        context_name: cleanText(req.body?.context_name) || "default",
        context_text: contextText,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    res.json({ context: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to update context", detail: error.message });
  }
});

app.get("/api/admin/services", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("admin_services").select("*").order("name");
    if (error) throw error;
    res.json({ services: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to load services", detail: error.message });
  }
});

app.put("/api/admin/services", async (req, res) => {
  try {
    const services = Array.isArray(req.body?.services) ? req.body.services : [];
    if (!services.length) return res.status(400).json({ error: "services array required" });
    const rows = services.map((s) => ({
      id: s.id || undefined,
      name: cleanText(s.name),
      price_from: cleanText(s.price_from),
      duration: cleanText(s.duration) || null,
      languages: Array.isArray(s.languages) ? s.languages : ["EN", "HU", "FR"],
      description: cleanText(s.description) || null,
      is_active: s.is_active !== false,
      updated_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase.from("admin_services").upsert(rows, { onConflict: "id" }).select("*");
    if (error) throw error;
    res.json({ services: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to save services", detail: error.message });
  }
});

app.get("/api/admin/languages", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("admin_languages").select("*").order("code");
    if (error) throw error;
    res.json({ languages: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to load languages", detail: error.message });
  }
});

app.put("/api/admin/languages", async (req, res) => {
  try {
    const languages = Array.isArray(req.body?.languages) ? req.body.languages : [];
    const rows = languages.map((l) => ({
      code: cleanText(l.code).toUpperCase(),
      label: cleanText(l.label),
      enabled: l.enabled !== false,
      traffic_percent: Number(l.traffic_percent || 0),
      updated_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase.from("admin_languages").upsert(rows, { onConflict: "code" }).select("*");
    if (error) throw error;
    res.json({ languages: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to save languages", detail: error.message });
  }
});

app.get("/api/admin/settings", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("admin_settings").select("*");
    if (error) throw error;
    const map = {};
    for (const row of data || []) map[row.key] = row.value;
    res.json({ settings: map });
  } catch (error) {
    res.status(500).json({ error: "Failed to load settings", detail: error.message });
  }
});

app.put("/api/admin/settings", async (req, res) => {
  try {
    const settings = req.body?.settings || {};
    const rows = Object.keys(settings).map((key) => ({
      key,
      value: settings[key],
      updated_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase.from("admin_settings").upsert(rows, { onConflict: "key" }).select("*");
    if (error) throw error;
    res.json({ settings: data || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to save settings", detail: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    if (ENV_OPENAI_API_KEY) {
      console.log("[AI] OpenAI key source: environment variable");
    } else {
      console.log("[AI] OPENAI_API_KEY env missing; will use admin settings fallback if configured.");
    }
    void logDatabaseConnectionStatus();
  });
}

module.exports = app;
