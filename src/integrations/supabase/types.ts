export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          user_id?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          chat_messages_sent: number | null
          date: string
          plans_generated: number | null
          user_id: string
        }
        Insert: {
          chat_messages_sent?: number | null
          date?: string
          plans_generated?: number | null
          user_id: string
        }
        Update: {
          chat_messages_sent?: number | null
          date?: string
          plans_generated?: number | null
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          date: string
          fats_g: number
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          protein_g: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          date?: string
          fats_g?: number
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name: string
          protein_g?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          date?: string
          fats_g?: number
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string
          protein_g?: number
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          exercise_name: string
          id: string
          reps: number | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          achieved_at?: string
          exercise_name: string
          id?: string
          reps?: number | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          achieved_at?: string
          exercise_name?: string
          id?: string
          reps?: number | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          carbs_target_g: number | null
          created_at: string
          daily_calorie_target: number | null
          diet_preference: string | null
          duration_preference: number | null
          email: string | null
          equipment: string[] | null
          fats_target_g: number | null
          fitness_level: Database["public"]["Enums"]["fitness_level"] | null
          goal: Database["public"]["Enums"]["fitness_goal"] | null
          id: string
          name: string | null
          onboarded_at: string | null
          protein_target_g: number | null
          role: string
          updated_at: string
          weekly_frequency: number | null
        }
        Insert: {
          avatar_url?: string | null
          carbs_target_g?: number | null
          created_at?: string
          daily_calorie_target?: number | null
          diet_preference?: string | null
          duration_preference?: number | null
          email?: string | null
          equipment?: string[] | null
          fats_target_g?: number | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          id: string
          name?: string | null
          onboarded_at?: string | null
          protein_target_g?: number | null
          role?: string
          updated_at?: string
          weekly_frequency?: number | null
        }
        Update: {
          avatar_url?: string | null
          carbs_target_g?: number | null
          created_at?: string
          daily_calorie_target?: number | null
          diet_preference?: string | null
          duration_preference?: number | null
          email?: string | null
          equipment?: string[] | null
          fats_target_g?: number | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          id?: string
          name?: string | null
          onboarded_at?: string | null
          protein_target_g?: number | null
          role?: string
          updated_at?: string
          weekly_frequency?: number | null
        }
        Relationships: []
      }
      seed_videos: {
        Row: {
          created_at: string
          duration_seconds: number
          equipment_tags: string[] | null
          goal_tags: string[] | null
          id: string
          level_tags: string[] | null
          phase: Database["public"]["Enums"]["video_phase"]
          thumbnail_url: string | null
          title: string
          youtube_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          equipment_tags?: string[] | null
          goal_tags?: string[] | null
          id?: string
          level_tags?: string[] | null
          phase: Database["public"]["Enums"]["video_phase"]
          thumbnail_url?: string | null
          title: string
          youtube_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          equipment_tags?: string[] | null
          goal_tags?: string[] | null
          id?: string
          level_tags?: string[] | null
          phase?: Database["public"]["Enums"]["video_phase"]
          thumbnail_url?: string | null
          title?: string
          youtube_id?: string
        }
        Relationships: []
      }
      segment_feedback: {
        Row: {
          created_at: string
          id: string
          segment_index: number
          session_id: string
          skipped: boolean | null
          user_id: string
          video_id: string
          watch_duration_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          segment_index: number
          session_id: string
          skipped?: boolean | null
          user_id: string
          video_id: string
          watch_duration_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          segment_index?: number
          session_id?: string
          skipped?: boolean | null
          user_id?: string
          video_id?: string
          watch_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "segment_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          date: string
          difficulty_rating:
            | Database["public"]["Enums"]["difficulty_rating"]
            | null
          duration_actual: number | null
          energy_level: number | null
          id: string
          plan_json: Json
          rating: number | null
          status: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date?: string
          difficulty_rating?:
            | Database["public"]["Enums"]["difficulty_rating"]
            | null
          duration_actual?: number | null
          energy_level?: number | null
          id?: string
          plan_json: Json
          rating?: number | null
          status?: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date?: string
          difficulty_rating?:
            | Database["public"]["Enums"]["difficulty_rating"]
            | null
          duration_actual?: number | null
          energy_level?: number | null
          id?: string
          plan_json?: Json
          rating?: number | null
          status?: Database["public"]["Enums"]["session_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "free" | "pro"
      chat_role: "user" | "assistant"
      difficulty_rating: "too_easy" | "just_right" | "too_hard"
      fitness_goal:
        | "lose_weight"
        | "build_muscle"
        | "improve_endurance"
        | "general_fitness"
        | "flexibility"
      fitness_level: "beginner" | "intermediate" | "advanced"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      session_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "partial"
        | "skipped"
      video_phase: "warmup" | "main" | "cooldown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["free", "pro"],
      chat_role: ["user", "assistant"],
      difficulty_rating: ["too_easy", "just_right", "too_hard"],
      fitness_goal: [
        "lose_weight",
        "build_muscle",
        "improve_endurance",
        "general_fitness",
        "flexibility",
      ],
      fitness_level: ["beginner", "intermediate", "advanced"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      session_status: [
        "pending",
        "in_progress",
        "completed",
        "partial",
        "skipped",
      ],
      video_phase: ["warmup", "main", "cooldown"],
    },
  },
} as const
