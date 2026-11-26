export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_admin: {
        Row: {
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      calendar_event: {
        Row: {
          course_id: number;
          edited_at: string | null;
          edited_by: string | null;
          event_date: string;
          id: number;
          import_batch_id: number | null;
          kind: Database["public"]["Enums"]["calendar_event_kind"];
          title: string;
        };
        ComputedFields: never;
        Insert: {
          course_id: number;
          edited_at?: string | null;
          edited_by?: string | null;
          event_date: string;
          id?: never;
          import_batch_id?: number | null;
          kind: Database["public"]["Enums"]["calendar_event_kind"];
          title: string;
        };
        Update: {
          course_id?: number;
          edited_at?: string | null;
          edited_by?: string | null;
          event_date?: string;
          id?: never;
          import_batch_id?: number | null;
          kind?: Database["public"]["Enums"]["calendar_event_kind"];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_event_import_batch_id_fkey";
            columns: ["import_batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batch";
            referencedColumns: ["id"];
          },
        ];
      };
      course: {
        Row: {
          code: string;
          edition: string;
          id: number;
          name: string;
          timezone: string;
          venue: string | null;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          edition: string;
          id?: never;
          name: string;
          timezone?: string;
          venue?: string | null;
        };
        Update: {
          code?: string;
          edition?: string;
          id?: never;
          name?: string;
          timezone?: string;
          venue?: string | null;
        };
        Relationships: [];
      };
      import_batch: {
        Row: {
          applied_at: string | null;
          course_id: number;
          created_at: string;
          created_by: string | null;
          declared_hours: number | null;
          file_name: string;
          id: number;
          period_end: string;
          period_start: string;
          report: NonNullable<Json>;
          sha256: string;
          status: Database["public"]["Enums"]["import_status"];
          storage_path: string;
        };
        ComputedFields: never;
        Insert: {
          applied_at?: string | null;
          course_id: number;
          created_at?: string;
          created_by?: string | null;
          declared_hours?: number | null;
          file_name: string;
          id?: never;
          period_end: string;
          period_start: string;
          report?: NonNullable<Json>;
          sha256: string;
          status?: Database["public"]["Enums"]["import_status"];
          storage_path: string;
        };
        Update: {
          applied_at?: string | null;
          course_id?: number;
          created_at?: string;
          created_by?: string | null;
          declared_hours?: number | null;
          file_name?: string;
          id?: never;
          period_end?: string;
          period_start?: string;
          report?: NonNullable<Json>;
          sha256?: string;
          status?: Database["public"]["Enums"]["import_status"];
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_batch_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
        ];
      };
      import_row: {
        Row: {
          assessment: Database["public"]["Enums"]["assessment_kind"] | null;
          batch_id: number;
          end_time: string | null;
          event_kind: Database["public"]["Enums"]["calendar_event_kind"] | null;
          id: number;
          issues: NonNullable<Json>;
          kind: Database["public"]["Enums"]["import_row_kind"];
          module_id: number | null;
          module_key: string | null;
          note: string | null;
          page: number | null;
          raw_module: string | null;
          raw_teacher: string | null;
          row_date: string | null;
          row_no: number | null;
          start_time: string | null;
          teacher_id: number | null;
          teacher_key: string | null;
          title: string | null;
        };
        ComputedFields: never;
        Insert: {
          assessment?: Database["public"]["Enums"]["assessment_kind"] | null;
          batch_id: number;
          end_time?: string | null;
          event_kind?: Database["public"]["Enums"]["calendar_event_kind"] | null;
          id?: never;
          issues?: NonNullable<Json>;
          kind: Database["public"]["Enums"]["import_row_kind"];
          module_id?: number | null;
          module_key?: string | null;
          note?: string | null;
          page?: number | null;
          raw_module?: string | null;
          raw_teacher?: string | null;
          row_date?: string | null;
          row_no?: number | null;
          start_time?: string | null;
          teacher_id?: number | null;
          teacher_key?: string | null;
          title?: string | null;
        };
        Update: {
          assessment?: Database["public"]["Enums"]["assessment_kind"] | null;
          batch_id?: number;
          end_time?: string | null;
          event_kind?: Database["public"]["Enums"]["calendar_event_kind"] | null;
          id?: never;
          issues?: NonNullable<Json>;
          kind?: Database["public"]["Enums"]["import_row_kind"];
          module_id?: number | null;
          module_key?: string | null;
          note?: string | null;
          page?: number | null;
          raw_module?: string | null;
          raw_teacher?: string | null;
          row_date?: string | null;
          row_no?: number | null;
          start_time?: string | null;
          teacher_id?: number | null;
          teacher_key?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "import_row_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batch";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_row_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "module";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_row_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "module_progress";
            referencedColumns: ["module_id"];
          },
          {
            foreignKeyName: "import_row_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teacher";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson: {
        Row: {
          assessment: Database["public"]["Enums"]["assessment_kind"] | null;
          course_id: number;
          edited_at: string | null;
          edited_by: string | null;
          end_time: string;
          hours: number | null;
          id: number;
          import_batch_id: number | null;
          lesson_date: string;
          module_id: number;
          note: string | null;
          start_time: string;
          teacher_id: number | null;
        };
        ComputedFields: never;
        Insert: {
          assessment?: Database["public"]["Enums"]["assessment_kind"] | null;
          course_id: number;
          edited_at?: string | null;
          edited_by?: string | null;
          end_time: string;
          hours?: never;
          id?: never;
          import_batch_id?: number | null;
          lesson_date: string;
          module_id: number;
          note?: string | null;
          start_time: string;
          teacher_id?: number | null;
        };
        Update: {
          assessment?: Database["public"]["Enums"]["assessment_kind"] | null;
          course_id?: number;
          edited_at?: string | null;
          edited_by?: string | null;
          end_time?: string;
          hours?: never;
          id?: never;
          import_batch_id?: number | null;
          lesson_date?: string;
          module_id?: number;
          note?: string | null;
          start_time?: string;
          teacher_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_import_batch_id_fkey";
            columns: ["import_batch_id"];
            isOneToOne: false;
            referencedRelation: "import_batch";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "module";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "module_progress";
            referencedColumns: ["module_id"];
          },
          {
            foreignKeyName: "lesson_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teacher";
            referencedColumns: ["id"];
          },
        ];
      };
      module: {
        Row: {
          area: Database["public"]["Enums"]["module_area"];
          course_id: number;
          id: number;
          in_curriculum: boolean;
          name: string;
          planned_hours: number | null;
          semesters: number[];
          sort_order: number | null;
        };
        ComputedFields: never;
        Insert: {
          area: Database["public"]["Enums"]["module_area"];
          course_id: number;
          id?: never;
          in_curriculum?: boolean;
          name: string;
          planned_hours?: number | null;
          semesters?: number[];
          sort_order?: number | null;
        };
        Update: {
          area?: Database["public"]["Enums"]["module_area"];
          course_id?: number;
          id?: never;
          in_curriculum?: boolean;
          name?: string;
          planned_hours?: number | null;
          semesters?: number[];
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
        ];
      };
      module_alias: {
        Row: {
          alias: string;
          module_id: number;
        };
        ComputedFields: never;
        Insert: {
          alias: string;
          module_id: number;
        };
        Update: {
          alias?: string;
          module_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "module_alias_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "module";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_alias_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "module_progress";
            referencedColumns: ["module_id"];
          },
        ];
      };
      teacher: {
        Row: {
          full_name: string;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          full_name: string;
          id?: never;
        };
        Update: {
          full_name?: string;
          id?: never;
        };
        Relationships: [];
      };
      teacher_alias: {
        Row: {
          alias: string;
          teacher_id: number;
        };
        ComputedFields: never;
        Insert: {
          alias: string;
          teacher_id: number;
        };
        Update: {
          alias?: string;
          teacher_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_alias_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teacher";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      module_progress: {
        Row: {
          area: Database["public"]["Enums"]["module_area"];
          course_id: number;
          done_hours: number | null;
          final_test_date: string | null;
          first_lesson: string | null;
          last_lesson: string | null;
          module_id: number;
          name: string;
          planned_hours: number | null;
          scheduled_hours: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "module_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      apply_import: { Args: { p_batch_id: number }; Returns: undefined };
      create_import_batch: {
        Args: { p_course_id: number; p_file: Json; p_rows: Json };
        Returns: number;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      assessment_kind: "intermediate_test" | "final_test" | "postponed_test";
      calendar_event_kind: "holiday" | "suspension" | "event" | "early_exit";
      import_row_kind: "lesson" | "event";
      import_status: "draft" | "applied" | "superseded" | "discarded";
      module_area: "theory" | "lab" | "internship";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      assessment_kind: ["intermediate_test", "final_test", "postponed_test"],
      calendar_event_kind: ["holiday", "suspension", "event", "early_exit"],
      import_row_kind: ["lesson", "event"],
      import_status: ["draft", "applied", "superseded", "discarded"],
      module_area: ["theory", "lab", "internship"],
    },
  },
} as const;
