# Dental Chatbot Backend API

## Setup

1. Copy `.env.example` to `.env`
2. Add your `OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`
3. In Supabase SQL Editor, run `backend/supabase/schema.sql`
4. Install packages:
   - `npm install`
5. Run server:
   - `npm run dev`

## Endpoints

- `GET /api/health`
- `POST /api/chat`
- `GET /api/leads`
- `GET /api/insights`
- `POST /api/chat/feedback`
- `POST /api/chat/support`
- `POST /api/chat/review`

## POST /api/chat body

```json
{
  "sessionId": "web-user-123",
  "language": "en",
  "message": "I have tooth pain and want to book"
}
```

## Notes

- Memory stores last 20 prompt/response turns per session.
- Leads, messages, feedback, support tickets, reviews, and insights are saved in Supabase tables.
- Chatbot only handles dental topics, services, pricing, booking, and related support.
