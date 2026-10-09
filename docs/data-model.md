# Study Time — Data Model Documentation

## Current Persistence (Local-First)

**Storage**: IndexedDB via `idb-keyval` under key `study-time:data:v2`
**Wrapper**: `src/features/core/repository.ts` (memory-cached, seeded on first load)
**Access**: TanStack Query hooks in `src/features/core/queries.ts` — only way components read/write data

### Domain Types (`src/features/core/types.ts`)

```typescript
// Fixed categories (Argentinian Spanish)
type CategoryId = "estudio" | "desarrollo" | "entrenamiento" | "personal";

interface Category {
  id: CategoryId;
  name: string;
  token: string; // Tailwind token suffix, e.g. "cat-estudio"
}

// Resource kinds
type ResourceKind = "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";

interface Resource {
  id: string;
  activityId: string;
  label: string;
  url: string;
  kind: ResourceKind;
}

// Deadline kinds
type DeadlineKind = "tp" | "parcial" | "final" | "recuperatorio";

interface Deadline {
  id: string;
  activityId: string;
  kind: DeadlineKind;
  title: string;
  date: string; // yyyy-MM-dd
}

// Activities (user-created)
interface Activity {
  id: string;
  categoryId: CategoryId;
  name: string;
  favorite: boolean;
  countsTowardGoal: boolean; // when false, sessions don't count toward weekly goal
  createdAt: string; // ISO timestamp
}

// Session modes & outcomes
type SessionMode = "autogestionada" | "grupo" | "rescate" | "repaso";
type SessionOutcome = "excelente" | "bien" | "regular" | "disperso";

// Core session record
interface Session {
  id: string;
  activityId: string;
  categoryId: CategoryId;
  date: string; // yyyy-MM-dd
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
  durationMin: number;
  mode: SessionMode;
  energy: number; // 1..5
  outcome: SessionOutcome | null;
  distractions: number;
  notes: string;
  nextStep: string;
}

// User settings
interface Settings {
  weeklyGoalMin: number; // default 600 (10 hours)
}

// Complete data aggregate
interface StudyData {
  activities: Activity[];
  sessions: Session[];
  resources: Resource[];
  generalResources: Resource[]; // not tied to activities
  deadlines: Deadline[];
  settings: Settings;
}
```

### Seed Data (`src/features/core/seed.ts`)

Empty arrays for everything except `settings: { weeklyGoalMin: 600 }`.

### Mutations (Queries)

All mutations go through `useDataMutation` helper in `queries.ts`:

- `useAddActivity`, `useUpdateActivity`, `useDeleteActivity`, `useRestoreActivity`
- `useAddResource`, `useUpdateResource`, `useDeleteResource`
- `useAddGeneralResource`, `useDeleteGeneralResource` (new)
- `useAddDeadline`, `useDeleteDeadline`
- `useAddSession`, `useUpdateSession`, `useDeleteSession`, `useRestoreSession`
- `useUpdateSettings`
- `useImportData` (full replace)

---

## Supabase Schema (PostgreSQL)

See `supabase/schema.sql` for full DDL. Key points:

### Tables

| Table               | Purpose                   | RLS Policy             |
| ------------------- | ------------------------- | ---------------------- |
| `categories`        | Fixed reference data      | Public read            |
| `user_settings`     | Weekly goal per user      | `auth.uid() = user_id` |
| `activities`        | User activities           | `auth.uid() = user_id` |
| `resources`         | Activity-linked resources | `auth.uid() = user_id` |
| `general_resources` | Global resources          | `auth.uid() = user_id` |
| `deadlines`         | Activity deadlines        | `auth.uid() = user_id` |
| `sessions`          | Study sessions            | `auth.uid() = user_id` |

### Enums

- `category_id`: `estudio`, `desarrollo`, `entrenamiento`, `personal`
- `resource_kind`: `pdf`, `youtube`, `campus`, `github`, `drive`, `apuntes`, `link`
- `deadline_kind`: `tp`, `parcial`, `final`, `recuperatorio`
- `session_mode`: `autogestionada`, `grupo`, `rescate`, `repaso`
- `session_outcome`: `excelente`, `bien`, `regular`, `disperso`

### Indexes

- Foreign key indexes on all `user_id`, `activity_id`, `category_id`
- `sessions_date_idx` on `date` for calendar queries
- `sessions_started_at_idx` for timeline queries

### Realtime

All tables added to `supabase_realtime` publication for live sync (optional).

---

## Supabase Integration (TanStack Start SSR + PKCE)

### Client Configuration

| File                         | Purpose                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `src/lib/supabase/client.ts` | Browser client (`createBrowserClient` from `@supabase/ssr`)          |
| `src/lib/supabase/server.ts` | SSR server client (`createServerClient` with cookie handling)        |
| `src/middleware/auth.ts`     | TanStack Start middleware injecting `supabase` + `user` into context |

### Auth Flow (Google OAuth + PKCE)

1. **Sign-in**: The settings dialog calls `signInWithOAuth` for Google and sets the current
   browser origin's `/auth/callback` as `redirectTo`.
2. **Callback**: `/auth/callback.tsx` waits for the browser Supabase client to process the PKCE
   code, then navigates to the dashboard. Login and signup pages are not used.
3. **Session**: `@supabase/ssr` persists the session using browser cookies.
4. **Logout**: The settings dialog calls `supabase.auth.signOut()`.

In Supabase **Authentication > URL Configuration**, set the production Site URL to
`https://studytime.pablolabs.com.ar` and add both
`https://studytime.pablolabs.com.ar/auth/callback` and
`http://localhost:8080/auth/callback` to the allowed Redirect URLs. The production callback
must be allow-listed; otherwise Supabase may fall back to its configured Site URL.

### Client-Side Auth State

`src/features/auth/auth-provider.tsx` wraps app with `AuthProvider`:

- Subscribes to `onAuthStateChange`
- Exposes `useAuth()` hook: `{ user, loading, signOut }`

### Repository & Queries

| File                                    | Purpose                                                                |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/supabase/repository.ts`        | Supabase-backed implementation of all CRUD operations                  |
| `src/features/core/supabase-queries.ts` | TanStack Query hooks using Supabase repository with optimistic updates |

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Migration Strategy

1. Deploy schema to Supabase
2. Add env vars to Cloudflare Pages
3. Switch imports from `repository`/`queries` to `supabaseRepository`/`supabase-queries`
4. Keep local `idb-keyval` as fallback for unauthenticated users (optional)
5. Export/import JSON for manual migration
