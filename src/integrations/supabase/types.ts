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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cached_clips: {
        Row: {
          category: string
          created_at: string
          duration: string | null
          external_id: string
          id: string
          preview_url: string | null
          resolution: string | null
          sort_order: number | null
          source_url: string | null
          thumbnail: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          duration?: string | null
          external_id: string
          id?: string
          preview_url?: string | null
          resolution?: string | null
          sort_order?: number | null
          source_url?: string | null
          thumbnail?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          duration?: string | null
          external_id?: string
          id?: string
          preview_url?: string | null
          resolution?: string | null
          sort_order?: number | null
          source_url?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      client_links: {
        Row: {
          client_name: string
          created_at: string
          event_date: string | null
          event_name: string
          expires_at: string | null
          id: string
          is_active: boolean
          token: string
        }
        Insert: {
          client_name: string
          created_at?: string
          event_date?: string | null
          event_name: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token: string
        }
        Update: {
          client_name?: string
          created_at?: string
          event_date?: string | null
          event_name?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token?: string
        }
        Relationships: []
      }
      creative_sessions: {
        Row: {
          circleback_summary: string | null
          circleback_url: string | null
          client_name: string
          created_at: string
          created_by: string | null
          creative_notes: string | null
          id: string
          is_active: boolean
          project_name: string
          technical_notes: string | null
          token: string
          updated_at: string
        }
        Insert: {
          circleback_summary?: string | null
          circleback_url?: string | null
          client_name: string
          created_at?: string
          created_by?: string | null
          creative_notes?: string | null
          id?: string
          is_active?: boolean
          project_name: string
          technical_notes?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          circleback_summary?: string | null
          circleback_url?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          creative_notes?: string | null
          id?: string
          is_active?: boolean
          project_name?: string
          technical_notes?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      link_clips: {
        Row: {
          clip_id: string
          created_at: string
          id: string
          link_id: string
        }
        Insert: {
          clip_id: string
          created_at?: string
          id?: string
          link_id: string
        }
        Update: {
          clip_id?: string
          created_at?: string
          id?: string
          link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_clips_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "cached_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clips_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "client_links"
            referencedColumns: ["id"]
          },
        ]
      }
      link_selections: {
        Row: {
          clip_category: string | null
          clip_id: string
          clip_thumbnail: string | null
          clip_title: string
          created_at: string
          id: string
          link_id: string
          note: string | null
          placements: string[] | null
          updated_at: string
        }
        Insert: {
          clip_category?: string | null
          clip_id: string
          clip_thumbnail?: string | null
          clip_title: string
          created_at?: string
          id?: string
          link_id: string
          note?: string | null
          placements?: string[] | null
          updated_at?: string
        }
        Update: {
          clip_category?: string | null
          clip_id?: string
          clip_thumbnail?: string | null
          clip_title?: string
          created_at?: string
          id?: string
          link_id?: string
          note?: string | null
          placements?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_selections_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "client_links"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_board_comments: {
        Row: {
          commenter_name: string
          content: string
          created_at: string
          id: string
          item_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          commenter_name: string
          content: string
          created_at?: string
          id?: string
          item_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          commenter_name?: string
          content?: string
          created_at?: string
          id?: string
          item_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_board_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "mood_board_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_board_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mood_board_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_board_items: {
        Row: {
          added_by: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          item_type: string
          session_id: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          item_type: string
          session_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          item_type?: string
          session_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_board_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creative_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_board_reactions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          reaction_type: string
          reactor_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          reaction_type: string
          reactor_name: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          reaction_type?: string
          reactor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_board_reactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "mood_board_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          link_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          link_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_uploads_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "client_links"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      claim_admin_role: { Args: { target_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
