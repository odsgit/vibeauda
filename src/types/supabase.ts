export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      tracks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          file_url: string;
          status: 'pending' | 'separating' | 'ready' | 'failed';
          duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          file_url: string;
          status?: 'pending' | 'separating' | 'ready' | 'failed';
          duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          file_url?: string;
          status?: 'pending' | 'separating' | 'ready' | 'failed';
          duration?: number | null;
          created_at?: string;
        };
      };
      stems: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          type: 'vocals' | 'drums' | 'bass' | 'other';
          file_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          user_id: string;
          type: 'vocals' | 'drums' | 'bass' | 'other';
          file_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          user_id?: string;
          type?: 'vocals' | 'drums' | 'bass' | 'other';
          file_url?: string;
          created_at?: string;
        };
      };
      sheets: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          content: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          user_id: string;
          content?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          user_id?: string;
          content?: Json;
          created_at?: string;
        };
      };
      mix_settings: {
        Row: {
          id: string;
          track_id: string;
          user_id: string;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          user_id: string;
          settings?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          user_id?: string;
          settings?: Json;
          updated_at?: string;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          tokens_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          tokens_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          tokens_used?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      track_status: 'pending' | 'separating' | 'ready' | 'failed';
    };
  };
}
