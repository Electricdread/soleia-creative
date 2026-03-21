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
      calendar_event_associations: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          event_uid: string
          id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          event_uid: string
          id?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_uid?: string
          id?: string
        }
        Relationships: []
      }
      calendar_event_attachments: {
        Row: {
          created_at: string
          created_by: string | null
          event_uid: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_uid: string
          file_name: string
          file_size?: number | null
          file_type?: string
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_uid?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      calendar_event_circleback: {
        Row: {
          circleback_summary: string | null
          circleback_url: string | null
          created_at: string
          event_uid: string
          id: string
          updated_at: string
        }
        Insert: {
          circleback_summary?: string | null
          circleback_url?: string | null
          created_at?: string
          event_uid: string
          id?: string
          updated_at?: string
        }
        Update: {
          circleback_summary?: string | null
          circleback_url?: string | null
          created_at?: string
          event_uid?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_event_client_info: {
        Row: {
          client_contact_email: string | null
          client_contact_name: string | null
          client_contact_phone: string | null
          content_deadline: string | null
          created_at: string
          deadline_notes: string | null
          event_uid: string
          id: string
          loading_fee_notes: string | null
          updated_at: string
        }
        Insert: {
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          content_deadline?: string | null
          created_at?: string
          deadline_notes?: string | null
          event_uid: string
          id?: string
          loading_fee_notes?: string | null
          updated_at?: string
        }
        Update: {
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          content_deadline?: string | null
          created_at?: string
          deadline_notes?: string | null
          event_uid?: string
          id?: string
          loading_fee_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      calendar_event_meeting_links: {
        Row: {
          created_at: string
          event_uid: string
          id: string
          label: string
          link_type: string
          url: string
        }
        Insert: {
          created_at?: string
          event_uid: string
          id?: string
          label: string
          link_type?: string
          url: string
        }
        Update: {
          created_at?: string
          event_uid?: string
          id?: string
          label?: string
          link_type?: string
          url?: string
        }
        Relationships: []
      }
      calendar_event_metadata: {
        Row: {
          color_label: string | null
          custom_notes: string | null
          event_uid: string
          id: string
          status_override: string | null
          updated_at: string
        }
        Insert: {
          color_label?: string | null
          custom_notes?: string | null
          event_uid: string
          id?: string
          status_override?: string | null
          updated_at?: string
        }
        Update: {
          color_label?: string | null
          custom_notes?: string | null
          event_uid?: string
          id?: string
          status_override?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      calendar_event_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          event_uid: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          event_uid: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          event_uid?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_event_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          event_uid: string
          id: string
          is_completed: boolean
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_uid: string
          id?: string
          is_completed?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_uid?: string
          id?: string
          is_completed?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
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
          is_public: boolean
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
          is_public?: boolean
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
          is_public?: boolean
          token?: string
        }
        Relationships: []
      }
      content_previews: {
        Row: {
          created_at: string
          id: string
          link_id: string
          sort_order: number | null
          subtitle: string | null
          title: string
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_id: string
          sort_order?: number | null
          subtitle?: string | null
          title: string
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link_id?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_previews_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "client_links"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_sessions: {
        Row: {
          circleback_summary: string | null
          circleback_url: string | null
          client_name: string
          cover_generated_at: string | null
          cover_images: Json | null
          cover_themes: string[] | null
          created_at: string
          created_by: string | null
          creative_notes: string | null
          dropbox_url: string | null
          featured_images: Json | null
          id: string
          is_active: boolean
          is_public: boolean
          project_name: string
          technical_notes: string | null
          token: string
          updated_at: string
        }
        Insert: {
          circleback_summary?: string | null
          circleback_url?: string | null
          client_name: string
          cover_generated_at?: string | null
          cover_images?: Json | null
          cover_themes?: string[] | null
          created_at?: string
          created_by?: string | null
          creative_notes?: string | null
          dropbox_url?: string | null
          featured_images?: Json | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          project_name: string
          technical_notes?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          circleback_summary?: string | null
          circleback_url?: string | null
          client_name?: string
          cover_generated_at?: string | null
          cover_images?: Json | null
          cover_themes?: string[] | null
          created_at?: string
          created_by?: string | null
          creative_notes?: string | null
          dropbox_url?: string | null
          featured_images?: Json | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          project_name?: string
          technical_notes?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      line_item_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          price: number
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          price?: number
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          price?: number
          title?: string
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
          scene_id: string | null
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
          scene_id?: string | null
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
          scene_id?: string | null
          session_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_board_items_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "session_scenes"
            referencedColumns: ["id"]
          },
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
      proposal_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          proposal_id: string
          sort_order: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          proposal_id: string
          sort_order?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          proposal_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_gallery_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_flat_fee: boolean
          price: number
          proposal_id: string
          quantity: number
          sort_order: number | null
          title: string
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_flat_fee?: boolean
          price?: number
          proposal_id: string
          quantity?: number
          sort_order?: number | null
          title: string
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_flat_fee?: boolean
          price?: number
          proposal_id?: string
          quantity?: number
          sort_order?: number | null
          title?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_timeline: {
        Row: {
          created_at: string
          details: string | null
          duration: string
          id: string
          phase: string
          proposal_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          duration: string
          id?: string
          phase: string
          proposal_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          details?: string | null
          duration?: string
          id?: string
          phase?: string
          proposal_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_timeline_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_name: string
          client_signature: string | null
          contact_email: string | null
          created_at: string
          created_by: string | null
          event_date: string | null
          event_name: string
          id: string
          is_active: boolean
          notes: string | null
          quote_date: string
          signed_at: string | null
          status: string
          token: string
          updated_at: string
          validity_days: number
          venue_name: string | null
        }
        Insert: {
          client_name: string
          client_signature?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          quote_date?: string
          signed_at?: string | null
          status?: string
          token: string
          updated_at?: string
          validity_days?: number
          venue_name?: string | null
        }
        Update: {
          client_name?: string
          client_signature?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string | null
          event_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          quote_date?: string
          signed_at?: string | null
          status?: string
          token?: string
          updated_at?: string
          validity_days?: number
          venue_name?: string | null
        }
        Relationships: []
      }
      session_scenes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          session_id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          session_id: string
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          session_id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_scenes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creative_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      synced_creative_content: {
        Row: {
          created_at: string
          external_id: string
          height: number | null
          id: string
          media_type: string | null
          sort_order: number | null
          source: string
          synced_at: string
          thumbnail: string | null
          title: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          external_id: string
          height?: number | null
          id?: string
          media_type?: string | null
          sort_order?: number | null
          source: string
          synced_at?: string
          thumbnail?: string | null
          title?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          external_id?: string
          height?: number | null
          id?: string
          media_type?: string | null
          sort_order?: number | null
          source?: string
          synced_at?: string
          thumbnail?: string | null
          title?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
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
