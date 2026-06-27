
  # Material Hub Digital Portal

  This portal now supports live, multi-device data using Supabase (Auth + Postgres + Realtime).

  ## Running the code

  1. Install dependencies:
  
  `npm i`

  2. Create `.env.local` in this folder with:

  ```
  VITE_SUPABASE_URL=your_supabase_project_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

  3. In Supabase SQL Editor, run:

  `supabase_material_hubs_setup.sql`

  4. In Supabase dashboard:
  - Authentication → Users: create admin users.
  - Use those credentials on `/login`.

  5. Start dev server:

  `npm run dev`

  ## Main capabilities

  - Admin login/logout via Supabase Auth
  - Add/Edit/Delete material hubs
  - Add/Edit/Delete inventory entries per hub
  - Public pages and admin dashboards read live data
  - Realtime subscriptions update connected devices automatically
  