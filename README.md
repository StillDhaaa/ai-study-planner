# 🎓 AI Study Planner

> A highly contextual, real-time, and AI-powered study companion designed to optimize student productivity through intelligent scheduling and the Pomodoro technique.

---

## ✨ Key Features

- 🧠 **Contextual AI Scheduling (Gemini API):** Powered by Google's latest Gemini models via Next.js Route Handlers. It breaks down broad targets into structured daily sessions.
- ⏰ **Real-Time Strict Planner & Smart Shift:** Automatically restricts study sessions between 16:00 (weekdays) or 09:00 (weekends) and firmly caps them at 20:00 to ensure healthy sleep habits. If accessed past 21:30 WIB, it intelligently shifts "Day 1" to tomorrow.
- 🍅 **Integrated Pomodoro Timer:** A sleek, Apple-inspired _Squircle_ timer widget that runs in sync with real-world time, complete with browser desktop notifications (even when switching tabs) and dynamic progress bars.
- 💾 **Supabase Persistence & JSONB:** Securely stores user schedules and chat histories using Supabase with Row Level Security (RLS) enabled.
- 🌗 **Cupertino Classic Glassmorphism UI:** Built with Next.js 16 (App Router), Tailwind CSS, and shadcn/ui, featuring seamless Light/Dark mode transitions via `next-themes`.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Route Handlers)
- **Styling:** Tailwind CSS, shadcn/ui, custom Glassmorphism variables
- **AI Engine:** Google Generative AI SDK (`@google/generative-ai`)
- **Database & Auth:** Supabase (PostgreSQL, JSONB data storage, Auth SSR)
- **State & Utilities:** Lucide React icons, Sonner Toasts, `next-themes`

---

## 🚀 Getting Started Locally

Follow these steps to run the project on your local machine:

### 1. Clone the Repository

```bash
git clone [https://github.com/YOUR_USERNAME/ai-study-planner.git](https://github.com/YOUR_USERNAME/ai-study-planner.git)
cd ai-study-planner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a .env file in the root directory and add your credentials:

```.env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url=
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key=
GEMINI_API_KEY=your_google_gemini_api_key=
```

### 4. Database Setup (Supabase)

Run the following SQL query in your Supabase SQL Editor to create the required schema:

```sql
CREATE TABLE user_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    tujuan_belajar TEXT NOT NULL,
    jadwal_data JSONB NOT NULL,
    chat_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own schedules" ON user_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert own schedules" ON user_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own schedules" ON user_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own schedules" ON user_schedules FOR DELETE USING (auth.uid() = user_id);
```

### 5. Run Development Server

```bash
npm run dev
```

Made by Dhaaa - [on GitHub](https://github.com/StillDhaaa)
