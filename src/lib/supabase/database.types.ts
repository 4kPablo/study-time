// Generated from supabase/schema.sql
// Run: npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          name: string;
          token: string;
        };
        Insert: {
          id: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          name: string;
          token: string;
        };
        Update: {
          id?: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          name?: string;
          token?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          weekly_goal_min: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          weekly_goal_min?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          weekly_goal_min?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          category_id: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          name: string;
          favorite: boolean;
          counts_toward_goal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          name: string;
          favorite?: boolean;
          counts_toward_goal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          name?: string;
          favorite?: boolean;
          counts_toward_goal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      resources: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string;
          label: string;
          url: string;
          kind: "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id: string;
          label: string;
          url: string;
          kind: "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_id?: string;
          label?: string;
          url?: string;
          kind?: "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";
          created_at?: string;
        };
      };
      general_resources: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          url: string;
          kind: "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          url: string;
          kind: "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          url?: string;
          kind?: "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";
          created_at?: string;
        };
      };
      deadlines: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string;
          kind: "tp" | "parcial" | "final" | "recuperatorio";
          title: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id: string;
          kind: "tp" | "parcial" | "final" | "recuperatorio";
          title: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_id?: string;
          kind?: "tp" | "parcial" | "final" | "recuperatorio";
          title?: string;
          date?: string;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string;
          category_id: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          date: string;
          started_at: string;
          ended_at: string;
          duration_min: number;
          mode: "autogestionada" | "grupo" | "rescate" | "repaso";
          energy: number;
          outcome: "excelente" | "bien" | "regular" | "disperso" | null;
          distractions: number;
          notes: string | null;
          next_step: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id: string;
          category_id: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          date: string;
          started_at: string;
          ended_at: string;
          duration_min: number;
          mode: "autogestionada" | "grupo" | "rescate" | "repaso";
          energy: number;
          outcome?: "excelente" | "bien" | "regular" | "disperso" | null;
          distractions?: number;
          notes?: string | null;
          next_step?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_id?: string;
          category_id?: "estudio" | "desarrollo" | "entrenamiento" | "personal";
          date?: string;
          started_at?: string;
          ended_at?: string;
          duration_min?: number;
          mode?: "autogestionada" | "grupo" | "rescate" | "repaso";
          energy?: number;
          outcome?: "excelente" | "bien" | "regular" | "disperso" | null;
          distractions?: number;
          notes?: string | null;
          next_step?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      category_id: "estudio" | "desarrollo" | "entrenamiento" | "personal";
      resource_kind: "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";
      deadline_kind: "tp" | "parcial" | "final" | "recuperatorio";
      session_mode: "autogestionada" | "grupo" | "rescate" | "repaso";
      session_outcome: "excelente" | "bien" | "regular" | "disperso";
    };
    CompositeTypes: Record<string, never>;
  };
}
