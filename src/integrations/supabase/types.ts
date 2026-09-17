/* eslint-disable */
// THIS IS AN AUTO-GENERATED FILE — DO NOT EDIT IT MANUALLY.
// Generated from the Supabase public schema.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Numeric = number

export interface Database {
  public: {
    Tables: {
      admin_login_events: {
        Row: {
          id: string
          user_id: string | null
          email: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          email: string
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "admin_login_events_user_id_fkey", columns: ["user_id"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
      cached_clips: {
        Row: {
          id: string
          external_id: string
          title: string
          thumbnail: string | null
          video_url: string | null
          preview_url: string | null
          resolution: string | null
          duration: string | null
          category: string
          source_url: string | null
          created_at: string
          updated_at: string
          sort_order: number | null
          drive_file_id: string | null
          drive_web_view_link: string | null
          original_storage: string
          category_id: string | null
        }
        Insert: {
          id?: string
          external_id: string
          title: string
          thumbnail?: string
          video_url?: string
          preview_url?: string
          resolution?: string
          duration?: string
          category: string
          source_url?: string
          created_at?: string
          updated_at?: string
          sort_order?: number
          drive_file_id?: string
          drive_web_view_link?: string
          original_storage?: string
          category_id?: string
        }
        Update: {
          id?: string
          external_id?: string
          title?: string
          thumbnail?: string
          video_url?: string
          preview_url?: string
          resolution?: string
          duration?: string
          category?: string
          source_url?: string
          created_at?: string
          updated_at?: string
          sort_order?: number
          drive_file_id?: string
          drive_web_view_link?: string
          original_storage?: string
          category_id?: string
        }
        Relationships: [
          { foreignKeyName: "cached_clips_category_id_fkey", columns: ["category_id"], referencedRelation: "lookbook_categories", referencedColumns: ["id"] },
        ]
      }
      calendar_event_associations: {
        Row: {
          id: string
          event_uid: string
          entity_type: string
          entity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          entity_type: string
          entity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          entity_type?: string
          entity_id?: string
          created_at?: string
        }
        Relationships: [
        ]
      }
      calendar_event_attachments: {
        Row: {
          id: string
          event_uid: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          file_name: string
          file_url: string
          file_type?: string
          file_size?: number
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          created_by?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "calendar_event_attachments_created_by_fkey", columns: ["created_by"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
      calendar_event_brief: {
        Row: {
          id: string
          event_uid: string
          group_name: string | null
          event_date_text: string | null
          event_time_text: string | null
          guest_count: string | null
          location: string | null
          deadline_on: string | null
          additional_notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          group_name?: string
          event_date_text?: string
          event_time_text?: string
          guest_count?: string
          location?: string
          deadline_on?: string
          additional_notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          group_name?: string
          event_date_text?: string
          event_time_text?: string
          guest_count?: string
          location?: string
          deadline_on?: string
          additional_notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      calendar_event_circleback: {
        Row: {
          id: string
          event_uid: string
          circleback_url: string | null
          circleback_summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          circleback_url?: string
          circleback_summary?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          circleback_url?: string
          circleback_summary?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      calendar_event_client_info: {
        Row: {
          id: string
          event_uid: string
          client_contact_name: string | null
          client_contact_email: string | null
          client_contact_phone: string | null
          loading_fee_notes: string | null
          content_deadline: string | null
          deadline_notes: string | null
          created_at: string
          updated_at: string
          reminder_days: number | null
        }
        Insert: {
          id?: string
          event_uid: string
          client_contact_name?: string
          client_contact_email?: string
          client_contact_phone?: string
          loading_fee_notes?: string
          content_deadline?: string
          deadline_notes?: string
          created_at?: string
          updated_at?: string
          reminder_days?: number
        }
        Update: {
          id?: string
          event_uid?: string
          client_contact_name?: string
          client_contact_email?: string
          client_contact_phone?: string
          loading_fee_notes?: string
          content_deadline?: string
          deadline_notes?: string
          created_at?: string
          updated_at?: string
          reminder_days?: number
        }
        Relationships: [
        ]
      }
      calendar_event_meeting_links: {
        Row: {
          id: string
          event_uid: string
          label: string
          url: string
          link_type: string
          created_at: string
          meeting_at: string | null
          duration_minutes: number | null
          attendees: string[] | null
        }
        Insert: {
          id?: string
          event_uid: string
          label: string
          url: string
          link_type?: string
          created_at?: string
          meeting_at?: string
          duration_minutes?: number
          attendees?: string[]
        }
        Update: {
          id?: string
          event_uid?: string
          label?: string
          url?: string
          link_type?: string
          created_at?: string
          meeting_at?: string
          duration_minutes?: number
          attendees?: string[]
        }
        Relationships: [
        ]
      }
      calendar_event_metadata: {
        Row: {
          id: string
          event_uid: string
          status_override: string | null
          color_label: string | null
          custom_notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          status_override?: string
          color_label?: string
          custom_notes?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          status_override?: string
          color_label?: string
          custom_notes?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      calendar_event_notes: {
        Row: {
          id: string
          event_uid: string
          content: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          content: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          content?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "calendar_event_notes_created_by_fkey", columns: ["created_by"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
      calendar_event_tasks: {
        Row: {
          id: string
          event_uid: string
          title: string
          is_completed: boolean
          sort_order: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          title: string
          is_completed?: boolean
          sort_order?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          title?: string
          is_completed?: boolean
          sort_order?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "calendar_event_tasks_created_by_fkey", columns: ["created_by"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
      calendar_event_tripleseat_cache: {
        Row: {
          id: string
          event_uid: string
          tripleseat_url: string
          scraped_data: Json
          scraped_at: string
          created_at: string
        }
        Insert: {
          id?: string
          event_uid: string
          tripleseat_url: string
          scraped_data?: Json
          scraped_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_uid?: string
          tripleseat_url?: string
          scraped_data?: Json
          scraped_at?: string
          created_at?: string
        }
        Relationships: [
        ]
      }
      calendar_local_events: {
        Row: {
          uid: string
          summary: string
          description: string | null
          location: string | null
          dtstart: string
          dtend: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          uid?: string
          summary: string
          description?: string
          location?: string
          dtstart: string
          dtend?: string
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          uid?: string
          summary?: string
          description?: string
          location?: string
          dtstart?: string
          dtend?: string
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "calendar_local_events_created_by_fkey", columns: ["created_by"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
      client_links: {
        Row: {
          id: string
          token: string
          event_name: string
          client_name: string
          event_date: string | null
          created_at: string
          expires_at: string | null
          is_active: boolean
          is_public: boolean
        }
        Insert: {
          id?: string
          token: string
          event_name: string
          client_name: string
          event_date?: string
          created_at?: string
          expires_at?: string
          is_active?: boolean
          is_public?: boolean
        }
        Update: {
          id?: string
          token?: string
          event_name?: string
          client_name?: string
          event_date?: string
          created_at?: string
          expires_at?: string
          is_active?: boolean
          is_public?: boolean
        }
        Relationships: [
        ]
      }
      content_previews: {
        Row: {
          id: string
          link_id: string
          title: string
          subtitle: string | null
          video_url: string | null
          video_type: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          link_id: string
          title: string
          subtitle?: string
          video_url?: string
          video_type?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          link_id?: string
          title?: string
          subtitle?: string
          video_url?: string
          video_type?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "content_previews_link_id_fkey", columns: ["link_id"], referencedRelation: "client_links", referencedColumns: ["id"] },
        ]
      }
      creative_briefs: {
        Row: {
          id: string
          creative_session_id: string
          mood: string | null
          vibe: string | null
          color_scheme: string | null
          avoid: string | null
          elevator_mode: string | null
          elevator_up: string | null
          elevator_down: string | null
          transforms_to_party: string | null
          looks_count: number | null
          notes: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
          notified_at: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          creative_session_id: string
          mood?: string
          vibe?: string
          color_scheme?: string
          avoid?: string
          elevator_mode?: string
          elevator_up?: string
          elevator_down?: string
          transforms_to_party?: string
          looks_count?: number
          notes?: string
          submitted_at?: string
          created_at?: string
          updated_at?: string
          notified_at?: string
          reviewed_at?: string
        }
        Update: {
          id?: string
          creative_session_id?: string
          mood?: string
          vibe?: string
          color_scheme?: string
          avoid?: string
          elevator_mode?: string
          elevator_up?: string
          elevator_down?: string
          transforms_to_party?: string
          looks_count?: number
          notes?: string
          submitted_at?: string
          created_at?: string
          updated_at?: string
          notified_at?: string
          reviewed_at?: string
        }
        Relationships: [
          { foreignKeyName: "creative_briefs_creative_session_id_fkey", columns: ["creative_session_id"], referencedRelation: "creative_sessions", referencedColumns: ["id"] },
        ]
      }
      creative_session_signoffs: {
        Row: {
          id: string
          session_id: string
          signer_name: string
          approved_item_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          signer_name: string
          approved_item_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          signer_name?: string
          approved_item_ids?: string[]
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "creative_session_signoffs_session_id_fkey", columns: ["session_id"], referencedRelation: "creative_sessions", referencedColumns: ["id"] },
        ]
      }
      creative_sessions: {
        Row: {
          id: string
          token: string
          project_name: string
          client_name: string
          circleback_url: string | null
          circleback_summary: string | null
          technical_notes: string | null
          creative_notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          cover_images: Json | null
          cover_themes: string[] | null
          cover_generated_at: string | null
          featured_images: Json | null
          is_public: boolean
          dropbox_url: string | null
          event_date: string | null
          proposal_id: string | null
          show_previz: boolean
          brief_enabled: boolean
          job_id: string | null
        }
        Insert: {
          id?: string
          token: string
          project_name: string
          client_name: string
          circleback_url?: string
          circleback_summary?: string
          technical_notes?: string
          creative_notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          cover_images?: Json
          cover_themes?: string[]
          cover_generated_at?: string
          featured_images?: Json
          is_public?: boolean
          dropbox_url?: string
          event_date?: string
          proposal_id?: string
          show_previz?: boolean
          brief_enabled?: boolean
          job_id?: string
        }
        Update: {
          id?: string
          token?: string
          project_name?: string
          client_name?: string
          circleback_url?: string
          circleback_summary?: string
          technical_notes?: string
          creative_notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          cover_images?: Json
          cover_themes?: string[]
          cover_generated_at?: string
          featured_images?: Json
          is_public?: boolean
          dropbox_url?: string
          event_date?: string
          proposal_id?: string
          show_previz?: boolean
          brief_enabled?: boolean
          job_id?: string
        }
        Relationships: [
          { foreignKeyName: "creative_sessions_created_by_fkey", columns: ["created_by"], referencedRelation: "users", referencedColumns: ["id"] },
          { foreignKeyName: "creative_sessions_proposal_id_fkey", columns: ["proposal_id"], referencedRelation: "proposals", referencedColumns: ["id"] },
          { foreignKeyName: "creative_sessions_job_id_fkey", columns: ["job_id"], referencedRelation: "jobs", referencedColumns: ["id"] },
        ]
      }
      drive_seen_files: {
        Row: {
          id: string
          proposal_id: string | null
          drive_folder_id: string
          drive_file_id: string
          file_name: string | null
          mime_type: string | null
          file_size: string | null
          web_view_link: string | null
          notified: boolean
          notified_at: string | null
          seen_at: string
          parent_folder_id: string | null
          parent_folder_name: string | null
          final_slot: string | null
          missing_since: string | null
        }
        Insert: {
          id?: string
          proposal_id?: string
          drive_folder_id: string
          drive_file_id: string
          file_name?: string
          mime_type?: string
          file_size?: string
          web_view_link?: string
          notified?: boolean
          notified_at?: string
          seen_at?: string
          parent_folder_id?: string
          parent_folder_name?: string
          final_slot?: string
          missing_since?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          drive_folder_id?: string
          drive_file_id?: string
          file_name?: string
          mime_type?: string
          file_size?: string
          web_view_link?: string
          notified?: boolean
          notified_at?: string
          seen_at?: string
          parent_folder_id?: string
          parent_folder_name?: string
          final_slot?: string
          missing_since?: string
        }
        Relationships: [
          { foreignKeyName: "drive_seen_files_proposal_id_fkey", columns: ["proposal_id"], referencedRelation: "proposals", referencedColumns: ["id"] },
        ]
      }
      email_send_log: {
        Row: {
          id: string
          message_id: string | null
          template_name: string
          recipient_email: string
          status: string
          error_message: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id?: string
          template_name: string
          recipient_email: string
          status: string
          error_message?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          template_name?: string
          recipient_email?: string
          status?: string
          error_message?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
        ]
      }
      email_send_state: {
        Row: {
          id: number
          retry_after_until: string | null
          batch_size: number
          send_delay_ms: number
          auth_email_ttl_minutes: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          id?: number
          retry_after_until?: string
          batch_size?: number
          send_delay_ms?: number
          auth_email_ttl_minutes?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          id?: number
          retry_after_until?: string
          batch_size?: number
          send_delay_ms?: number
          auth_email_ttl_minutes?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: [
        ]
      }
      email_unsubscribe_tokens: {
        Row: {
          id: string
          token: string
          email: string
          created_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          token: string
          email: string
          created_at?: string
          used_at?: string
        }
        Update: {
          id?: string
          token?: string
          email?: string
          created_at?: string
          used_at?: string
        }
        Relationships: [
        ]
      }
      job_assignees: {
        Row: {
          id: string
          job_id: string
          user_id: string
          email: string
          display_name: string | null
          created_at: string
          created_by: string | null
          notified_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          email: string
          display_name?: string
          created_at?: string
          created_by?: string
          notified_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          email?: string
          display_name?: string
          created_at?: string
          created_by?: string
          notified_at?: string
        }
        Relationships: [
          { foreignKeyName: "job_assignees_job_id_fkey", columns: ["job_id"], referencedRelation: "jobs", referencedColumns: ["id"] },
        ]
      }
      jobs: {
        Row: {
          id: string
          title: string
          client_name: string
          event_date: string | null
          track: public.Enums.job_track
          call_held_on: string | null
          drive_folder_id: string | null
          drive_folder_url: string | null
          notes: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          client_name: string
          event_date?: string
          track?: public.Enums.job_track
          call_held_on?: string
          drive_folder_id?: string
          drive_folder_url?: string
          notes?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          client_name?: string
          event_date?: string
          track?: public.Enums.job_track
          call_held_on?: string
          drive_folder_id?: string
          drive_folder_url?: string
          notes?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      line_item_categories: {
        Row: {
          name: string
          intro: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          name: string
          intro?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          name?: string
          intro?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
        ]
      }
      line_item_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          price: string
          category: string | null
          created_by: string | null
          created_at: string
          long_description: string | null
          deliverables: string[]
          ideal_for: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          title: string
          description?: string
          price?: string
          category?: string
          created_by?: string
          created_at?: string
          long_description?: string
          deliverables?: string[]
          ideal_for?: string
          sort_order?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: string
          category?: string
          created_by?: string
          created_at?: string
          long_description?: string
          deliverables?: string[]
          ideal_for?: string
          sort_order?: number
        }
        Relationships: [
        ]
      }
      link_clips: {
        Row: {
          id: string
          link_id: string
          clip_id: string
          created_at: string
        }
        Insert: {
          id?: string
          link_id: string
          clip_id: string
          created_at?: string
        }
        Update: {
          id?: string
          link_id?: string
          clip_id?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "link_clips_clip_id_fkey", columns: ["clip_id"], referencedRelation: "cached_clips", referencedColumns: ["id"] },
          { foreignKeyName: "link_clips_link_id_fkey", columns: ["link_id"], referencedRelation: "client_links", referencedColumns: ["id"] },
        ]
      }
      link_selections: {
        Row: {
          id: string
          link_id: string
          clip_id: string
          clip_title: string
          clip_thumbnail: string | null
          clip_category: string | null
          note: string | null
          placements: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          link_id: string
          clip_id: string
          clip_title: string
          clip_thumbnail?: string
          clip_category?: string
          note?: string
          placements?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          link_id?: string
          clip_id?: string
          clip_title?: string
          clip_thumbnail?: string
          clip_category?: string
          note?: string
          placements?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "link_selections_link_id_fkey", columns: ["link_id"], referencedRelation: "client_links", referencedColumns: ["id"] },
        ]
      }
      lookbook_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      lookbook_shares: {
        Row: {
          id: string
          token: string
          title: string
          intro_note: string | null
          category_id: string | null
          clip_ids: string[] | null
          is_active: boolean
          expires_at: string | null
          view_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token: string
          title: string
          intro_note?: string
          category_id?: string
          clip_ids?: string[]
          is_active?: boolean
          expires_at?: string
          view_count?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token?: string
          title?: string
          intro_note?: string
          category_id?: string
          clip_ids?: string[]
          is_active?: boolean
          expires_at?: string
          view_count?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "lookbook_shares_category_id_fkey", columns: ["category_id"], referencedRelation: "lookbook_categories", referencedColumns: ["id"] },
        ]
      }
      mood_board_comments: {
        Row: {
          id: string
          item_id: string
          parent_id: string | null
          commenter_name: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          parent_id?: string
          commenter_name: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          parent_id?: string
          commenter_name?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "mood_board_comments_parent_id_fkey", columns: ["parent_id"], referencedRelation: "mood_board_comments", referencedColumns: ["id"] },
          { foreignKeyName: "mood_board_comments_item_id_fkey", columns: ["item_id"], referencedRelation: "mood_board_items", referencedColumns: ["id"] },
        ]
      }
      mood_board_items: {
        Row: {
          id: string
          session_id: string
          item_type: string
          title: string | null
          url: string | null
          file_url: string | null
          thumbnail_url: string | null
          description: string | null
          added_by: string | null
          created_at: string
          sort_order: number | null
          scene_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          item_type: string
          title?: string
          url?: string
          file_url?: string
          thumbnail_url?: string
          description?: string
          added_by?: string
          created_at?: string
          sort_order?: number
          scene_id?: string
        }
        Update: {
          id?: string
          session_id?: string
          item_type?: string
          title?: string
          url?: string
          file_url?: string
          thumbnail_url?: string
          description?: string
          added_by?: string
          created_at?: string
          sort_order?: number
          scene_id?: string
        }
        Relationships: [
          { foreignKeyName: "mood_board_items_scene_id_fkey", columns: ["scene_id"], referencedRelation: "session_scenes", referencedColumns: ["id"] },
          { foreignKeyName: "mood_board_items_session_id_fkey", columns: ["session_id"], referencedRelation: "creative_sessions", referencedColumns: ["id"] },
        ]
      }
      mood_board_reactions: {
        Row: {
          id: string
          item_id: string
          reaction_type: string
          reactor_name: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          reaction_type: string
          reactor_name: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          reaction_type?: string
          reactor_name?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "mood_board_reactions_item_id_fkey", columns: ["item_id"], referencedRelation: "mood_board_items", referencedColumns: ["id"] },
        ]
      }
      notification_watermarks: {
        Row: {
          key: string
          last_run_at: string
        }
        Insert: {
          key: string
          last_run_at: string
        }
        Update: {
          key?: string
          last_run_at?: string
        }
        Relationships: [
        ]
      }
      pm_intro_confirmations: {
        Row: {
          token: string
          email: string
          display_name: string | null
          job_count: number
          sent_at: string
          confirmed_at: string | null
        }
        Insert: {
          token?: string
          email: string
          display_name?: string
          job_count?: number
          sent_at?: string
          confirmed_at?: string
        }
        Update: {
          token?: string
          email?: string
          display_name?: string
          job_count?: number
          sent_at?: string
          confirmed_at?: string
        }
        Relationships: [
        ]
      }
      pre_call_packets: {
        Row: {
          id: string
          title: string
          client_name: string | null
          event_date: string | null
          intro: string | null
          inclusions: Json
          scope: string | null
          notes: string | null
          token: string
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          drive_folder_url: string | null
          drive_folder_id: string | null
          creative_guide_url: string | null
          kind: string
          job_id: string | null
          deploy_notified_at: string | null
        }
        Insert: {
          id?: string
          title: string
          client_name?: string
          event_date?: string
          intro?: string
          inclusions?: Json
          scope?: string
          notes?: string
          token?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          drive_folder_url?: string
          drive_folder_id?: string
          creative_guide_url?: string
          kind?: string
          job_id?: string
          deploy_notified_at?: string
        }
        Update: {
          id?: string
          title?: string
          client_name?: string
          event_date?: string
          intro?: string
          inclusions?: Json
          scope?: string
          notes?: string
          token?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          drive_folder_url?: string
          drive_folder_id?: string
          creative_guide_url?: string
          kind?: string
          job_id?: string
          deploy_notified_at?: string
        }
        Relationships: [
          { foreignKeyName: "pre_call_packets_created_by_fkey", columns: ["created_by"], referencedRelation: "users", referencedColumns: ["id"] },
          { foreignKeyName: "pre_call_packets_job_id_fkey", columns: ["job_id"], referencedRelation: "jobs", referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "profiles_user_id_fkey", columns: ["user_id"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
      proposal_gallery: {
        Row: {
          id: string
          proposal_id: string
          image_url: string
          caption: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          image_url: string
          caption?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          image_url?: string
          caption?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "proposal_gallery_proposal_id_fkey", columns: ["proposal_id"], referencedRelation: "proposals", referencedColumns: ["id"] },
        ]
      }
      proposal_items: {
        Row: {
          id: string
          proposal_id: string
          title: string
          description: string | null
          price: string
          sort_order: number | null
          created_at: string
          quantity: number
          category: string | null
          unit: string | null
          is_flat_fee: boolean
          client_selected: boolean
        }
        Insert: {
          id?: string
          proposal_id: string
          title: string
          description?: string
          price?: string
          sort_order?: number
          created_at?: string
          quantity?: number
          category?: string
          unit?: string
          is_flat_fee?: boolean
          client_selected?: boolean
        }
        Update: {
          id?: string
          proposal_id?: string
          title?: string
          description?: string
          price?: string
          sort_order?: number
          created_at?: string
          quantity?: number
          category?: string
          unit?: string
          is_flat_fee?: boolean
          client_selected?: boolean
        }
        Relationships: [
          { foreignKeyName: "proposal_items_proposal_id_fkey", columns: ["proposal_id"], referencedRelation: "proposals", referencedColumns: ["id"] },
        ]
      }
      proposal_signature_history: {
        Row: {
          id: string
          proposal_id: string
          client_signature: string
          signed_at: string
          selected_item_ids: string[]
          item_quantities: Json
          total: string | null
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          client_signature: string
          signed_at: string
          selected_item_ids?: string[]
          item_quantities?: Json
          total?: string
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          client_signature?: string
          signed_at?: string
          selected_item_ids?: string[]
          item_quantities?: Json
          total?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "proposal_signature_history_proposal_id_fkey", columns: ["proposal_id"], referencedRelation: "proposals", referencedColumns: ["id"] },
        ]
      }
      proposal_timeline: {
        Row: {
          id: string
          proposal_id: string
          phase: string
          duration: string
          details: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          phase: string
          duration: string
          details?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          phase?: string
          duration?: string
          details?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "proposal_timeline_proposal_id_fkey", columns: ["proposal_id"], referencedRelation: "proposals", referencedColumns: ["id"] },
        ]
      }
      proposals: {
        Row: {
          id: string
          token: string
          event_name: string
          client_name: string
          venue_name: string | null
          event_date: string | null
          quote_date: string
          validity_days: number
          contact_email: string | null
          status: string
          client_signature: string | null
          signed_at: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          drive_folder_url: string | null
          drive_folder_id: string | null
          creative_call_url: string | null
          is_pre_call_packet: boolean
          proposal_scenario: string
          assigned_pm_id: string | null
          assigned_pm_name: string | null
          assigned_pm_email: string | null
          client_email: string | null
          job_id: string | null
          signoff_due_on: string | null
          discount_type: string | null
          discount_value: string | null
          discount_label: string | null
        }
        Insert: {
          id?: string
          token: string
          event_name: string
          client_name: string
          venue_name?: string
          event_date?: string
          quote_date?: string
          validity_days?: number
          contact_email?: string
          status?: string
          client_signature?: string
          signed_at?: string
          notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          drive_folder_url?: string
          drive_folder_id?: string
          creative_call_url?: string
          is_pre_call_packet?: boolean
          proposal_scenario?: string
          assigned_pm_id?: string
          assigned_pm_name?: string
          assigned_pm_email?: string
          client_email?: string
          job_id?: string
          signoff_due_on?: string
          discount_type?: string
          discount_value?: string
          discount_label?: string
        }
        Update: {
          id?: string
          token?: string
          event_name?: string
          client_name?: string
          venue_name?: string
          event_date?: string
          quote_date?: string
          validity_days?: number
          contact_email?: string
          status?: string
          client_signature?: string
          signed_at?: string
          notes?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          drive_folder_url?: string
          drive_folder_id?: string
          creative_call_url?: string
          is_pre_call_packet?: boolean
          proposal_scenario?: string
          assigned_pm_id?: string
          assigned_pm_name?: string
          assigned_pm_email?: string
          client_email?: string
          job_id?: string
          signoff_due_on?: string
          discount_type?: string
          discount_value?: string
          discount_label?: string
        }
        Relationships: [
          { foreignKeyName: "proposals_job_id_fkey", columns: ["job_id"], referencedRelation: "jobs", referencedColumns: ["id"] },
          { foreignKeyName: "proposals_created_by_fkey", columns: ["created_by"], referencedRelation: "users", referencedColumns: ["id"] },
          { foreignKeyName: "proposals_assigned_pm_id_fkey", columns: ["assigned_pm_id"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
      report_subscriptions: {
        Row: {
          email: string
          display_name: string | null
          scope: string
          created_at: string
        }
        Insert: {
          email: string
          display_name?: string
          scope?: string
          created_at?: string
        }
        Update: {
          email?: string
          display_name?: string
          scope?: string
          created_at?: string
        }
        Relationships: [
        ]
      }
      session_previz_clips: {
        Row: {
          id: string
          session_id: string
          title: string
          url: string
          sort_order: number
          is_default: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          title: string
          url: string
          sort_order?: number
          is_default?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          title?: string
          url?: string
          sort_order?: number
          is_default?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "session_previz_clips_session_id_fkey", columns: ["session_id"], referencedRelation: "creative_sessions", referencedColumns: ["id"] },
        ]
      }
      session_previz_cues: {
        Row: {
          id: string
          clip_id: string
          time_seconds: string
          label: string
          color: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clip_id: string
          time_seconds?: string
          label?: string
          color?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clip_id?: string
          time_seconds?: string
          label?: string
          color?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "session_previz_cues_clip_id_fkey", columns: ["clip_id"], referencedRelation: "session_previz_clips", referencedColumns: ["id"] },
        ]
      }
      session_scenes: {
        Row: {
          id: string
          session_id: string
          title: string
          description: string | null
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          title: string
          description?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          title?: string
          description?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "session_scenes_session_id_fkey", columns: ["session_id"], referencedRelation: "creative_sessions", referencedColumns: ["id"] },
        ]
      }
      session_uploads: {
        Row: {
          id: string
          link_id: string
          file_url: string
          file_name: string
          file_type: string
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          link_id: string
          file_url: string
          file_name: string
          file_type: string
          file_size?: number
          created_at?: string
        }
        Update: {
          id?: string
          link_id?: string
          file_url?: string
          file_name?: string
          file_type?: string
          file_size?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "session_uploads_link_id_fkey", columns: ["link_id"], referencedRelation: "client_links", referencedColumns: ["id"] },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      suppressed_emails: {
        Row: {
          id: string
          email: string
          reason: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          reason: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          reason?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
        ]
      }
      synced_creative_content: {
        Row: {
          id: string
          external_id: string
          source: string
          url: string
          thumbnail: string | null
          title: string | null
          media_type: string | null
          width: number | null
          height: number | null
          sort_order: number | null
          synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          external_id: string
          source: string
          url: string
          thumbnail?: string
          title?: string
          media_type?: string
          width?: number
          height?: number
          sort_order?: number
          synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          external_id?: string
          source?: string
          url?: string
          thumbnail?: string
          title?: string
          media_type?: string
          width?: number
          height?: number
          sort_order?: number
          synced_at?: string
          created_at?: string
        }
        Relationships: [
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: public.Enums.app_role
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: public.Enums.app_role
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: public.Enums.app_role
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "user_roles_user_id_fkey", columns: ["user_id"], referencedRelation: "users", referencedColumns: ["id"] },
        ]
      }
    ]
    Views: {
    }
    Functions: {
      // admin_exists(): boolean
      // admin_reorder_rate_card_items(p_items jsonb): void
      // capture_proposal_signature(p_proposal_id uuid): void
      // claim_admin_role(target_user_id uuid): boolean
      // delete_email(queue_name text, message_id bigint): boolean
      // delete_session_upload_by_token(p_token text, p_upload_id uuid): boolean
      // email_queue_dispatch(): void
      // email_queue_wake(): trigger
      // enqueue_email(queue_name text, payload jsonb): bigint
      // get_client_link_by_token(p_token text): SETOF client_links
      // get_creative_brief_by_token(p_token text): SETOF creative_briefs
      // get_lookbook_share_by_token(p_token text): SETOF lookbook_shares
      // get_packet_by_token(p_token text): SETOF pre_call_packets
      // get_proposal_by_token(p_token text): SETOF proposals
      // get_proposal_gallery_by_token(p_token text): SETOF proposal_gallery
      // get_proposal_items_by_token(p_token text): SETOF proposal_items
      // get_proposal_timeline_by_token(p_token text): SETOF proposal_timeline
      // get_rate_card_addons(): TABLE(id uuid, title text, price numeric, category text, ideal_for text, long_description text, deliverables text[], sort_order integer)
      // get_rate_card_categories(): TABLE(name text, intro text, sort_order integer)
      // handle_new_user(): trigger
      // has_role(_user_id uuid, _role app_role): boolean
      // increment_lookbook_share_view(p_token text): void
      // is_active_link(p_link_id uuid): boolean
      // is_active_public_proposal(p_proposal_id uuid): boolean
      // list_admin_users(): TABLE(user_id uuid, email text, display_name text)
      // move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb): bigint
      // read_email_batch(queue_name text, batch_size integer, vt integer): TABLE(msg_id bigint, read_ct integer, message jsonb)
      // reset_proposal_signature(p_proposal_id uuid): uuid
      // restore_proposal_signature(p_history_id uuid): uuid
      // save_creative_brief_by_token(p_token text, p_mood text DEFAULT NULL::text, p_vibe text DEFAULT NULL::text, p_color_scheme text DEFAULT NULL::text, p_avoid text DEFAULT NULL::text, p_elevator_mode text DEFAULT NULL::text, p_elevator_up text DEFAULT NULL::text, p_elevator_down text DEFAULT NULL::text, p_transforms_to_party text DEFAULT NULL::text, p_looks_count integer DEFAULT NULL::integer, p_notes text DEFAULT NULL::text, p_submit boolean DEFAULT false): creative_briefs
      // sign_proposal_by_token(p_token text, p_signature text, p_item_quantities jsonb DEFAULT '[]'::jsonb, p_selected_ids uuid[] DEFAULT NULL::uuid[]): uuid
      // sign_proposal_by_token(p_token text, p_signature text, p_item_quantities jsonb DEFAULT '[]'::jsonb): uuid
      // update_updated_at_column(): trigger
    }
    Enums: {
      app_role: "admin" | "user" | "pm"
      job_track: "creative" | "in_house"
    }
    CompositeTypes: {
      // admin_login_events
      // cached_clips
      // calendar_event_associations
      // calendar_event_attachments
      // calendar_event_brief
      // calendar_event_circleback
      // calendar_event_client_info
      // calendar_event_meeting_links
      // calendar_event_metadata
      // calendar_event_notes
      // calendar_event_tasks
      // calendar_event_tripleseat_cache
      // calendar_local_events
      // client_links
      // content_previews
      // creative_briefs
      // creative_session_signoffs
      // creative_sessions
      // drive_seen_files
      // email_send_log
      // email_send_state
      // email_unsubscribe_tokens
      // job_assignees
      // jobs
      // line_item_categories
      // line_item_templates
      // link_clips
      // link_selections
      // lookbook_categories
      // lookbook_shares
      // mood_board_comments
      // mood_board_items
      // mood_board_reactions
      // notification_watermarks
      // pm_intro_confirmations
      // pre_call_packets
      // profiles
      // proposal_gallery
      // proposal_items
      // proposal_signature_history
      // proposal_timeline
      // proposals
      // report_subscriptions
      // session_previz_clips
      // session_previz_cues
      // session_scenes
      // session_uploads
      // site_settings
      // suppressed_emails
      // synced_creative_content
      // user_roles
    }
  }
}

export type Schema = Database[Extract<keyof Database, "public">]

export type Tables<Role extends Record<string, unknown> = Schema["Tables"], TableName extends keyof Role = keyof Role> = Role[TableName]

export type TablesInsert<Role extends Record<string, unknown> = Schema["Tables"], TableName extends keyof Role = keyof Role> = Role[TableName]["Insert"]

export type TablesUpdate<Role extends Record<string, unknown> = Schema["Tables"], TableName extends keyof Role = keyof Role> = Role[TableName]["Update"]
