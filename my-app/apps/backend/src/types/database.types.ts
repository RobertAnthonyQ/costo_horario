export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      componentes: {
        Row: {
          id: number;
          nombre: string;
        };
        Insert: {
          id?: number;
          nombre: string;
        };
        Update: {
          id?: number;
          nombre?: string;
        };
        Relationships: [];
      };
      equipo: {
        Row: {
          created_at: string | null;
          id: number;
          nombre: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          nombre: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          nombre?: string;
        };
        Relationships: [];
      };
      flota: {
        Row: {
          created_at: string | null;
          id: number;
          nombre: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          nombre: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          nombre?: string;
        };
        Relationships: [];
      };
      informe_costo_horario: {
        Row: {
          anios_financiamiento: number | null;
          anios_seguro: number | null;
          escenarios_horas: Json | null;
          fecha_calculo: string | null;
          id: number;
          machine_id: number;
          mes_por_anio: number | null;
          resultado_completo_json: Json;
          tasa_financiamiento_usada: number | null;
          tasa_seguro_usada: number | null;
          usuario_id: string | null;
        };
        Insert: {
          anios_financiamiento?: number | null;
          anios_seguro?: number | null;
          escenarios_horas?: Json | null;
          fecha_calculo?: string | null;
          id?: number;
          machine_id: number;
          mes_por_anio?: number | null;
          resultado_completo_json: Json;
          tasa_financiamiento_usada?: number | null;
          tasa_seguro_usada?: number | null;
          usuario_id?: string | null;
        };
        Update: {
          anios_financiamiento?: number | null;
          anios_seguro?: number | null;
          escenarios_horas?: Json | null;
          fecha_calculo?: string | null;
          id?: number;
          machine_id?: number;
          mes_por_anio?: number | null;
          resultado_completo_json?: Json;
          tasa_financiamiento_usada?: number | null;
          tasa_seguro_usada?: number | null;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'informe_costo_horario_machine_id_fkey';
            columns: ['machine_id'];
            isOneToOne: false;
            referencedRelation: 'machines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'informe_costo_horario_usuario_id_fkey';
            columns: ['usuario_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      machines: {
        Row: {
          created_at: string | null;
          estado: string | null;
          horometro_inicial: number | null;
          id: number;
          id_equipo_interno: string | null;
          link_imagen: string | null;
          modelo_id: number | null;
          otros_json: Json | null;
          politica_depreciacion: number | null;
          tiempo_entrega: number | null;
          valor_similar_nuevo: number | null;
          valor_venta: number | null;
          vida_util: number | null;
        };
        Insert: {
          created_at?: string | null;
          estado?: string | null;
          horometro_inicial?: number | null;
          id?: number;
          id_equipo_interno?: string | null;
          link_imagen?: string | null;
          modelo_id?: number | null;
          otros_json?: Json | null;
          politica_depreciacion?: number | null;
          tiempo_entrega?: number | null;
          valor_similar_nuevo?: number | null;
          valor_venta?: number | null;
          vida_util?: number | null;
        };
        Update: {
          created_at?: string | null;
          estado?: string | null;
          horometro_inicial?: number | null;
          id?: number;
          id_equipo_interno?: string | null;
          link_imagen?: string | null;
          modelo_id?: number | null;
          otros_json?: Json | null;
          politica_depreciacion?: number | null;
          tiempo_entrega?: number | null;
          valor_similar_nuevo?: number | null;
          valor_venta?: number | null;
          vida_util?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'machines_modelo_id_fkey';
            columns: ['modelo_id'];
            isOneToOne: false;
            referencedRelation: 'modelos';
            referencedColumns: ['id'];
          },
        ];
      };
      marcas: {
        Row: {
          created_at: string | null;
          id: number;
          nombre: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          nombre: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          nombre?: string;
        };
        Relationships: [];
      };
      modelo_componentes_historico: {
        Row: {
          componente_id: number;
          distribucion: number | null;
          fecha_efectiva: string;
          id: number;
          modelo_id: number;
          monto_usd: number | null;
          pcr: number | null;
        };
        Insert: {
          componente_id: number;
          distribucion?: number | null;
          fecha_efectiva: string;
          id?: number;
          modelo_id: number;
          monto_usd?: number | null;
          pcr?: number | null;
        };
        Update: {
          componente_id?: number;
          distribucion?: number | null;
          fecha_efectiva?: string;
          id?: number;
          modelo_id?: number;
          monto_usd?: number | null;
          pcr?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'modelo_componentes_historico_componente_id_fkey';
            columns: ['componente_id'];
            isOneToOne: false;
            referencedRelation: 'componentes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'modelo_componentes_historico_modelo_id_fkey';
            columns: ['modelo_id'];
            isOneToOne: false;
            referencedRelation: 'modelos';
            referencedColumns: ['id'];
          },
        ];
      };
      modelos: {
        Row: {
          created_at: string | null;
          equipo_id: number | null;
          flota_id: number | null;
          id: number;
          marca_id: number;
          nombre: string;
          porcentaje_utilidad: number;
          vida_util_fabricante: number | null;
        };
        Insert: {
          created_at?: string | null;
          equipo_id?: number | null;
          flota_id?: number | null;
          id?: number;
          marca_id: number;
          nombre: string;
          porcentaje_utilidad?: number;
          vida_util_fabricante?: number | null;
        };
        Update: {
          created_at?: string | null;
          equipo_id?: number | null;
          flota_id?: number | null;
          id?: number;
          marca_id?: number;
          nombre?: string;
          porcentaje_utilidad?: number;
          vida_util_fabricante?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'modelos_equipo_id_fkey';
            columns: ['equipo_id'];
            isOneToOne: false;
            referencedRelation: 'equipo';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'modelos_flota_id_fkey';
            columns: ['flota_id'];
            isOneToOne: false;
            referencedRelation: 'flota';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'modelos_marca_id_fkey';
            columns: ['marca_id'];
            isOneToOne: false;
            referencedRelation: 'marcas';
            referencedColumns: ['id'];
          },
        ];
      };
      posesion_historial: {
        Row: {
          comentario: string | null;
          fecha_calculo: string | null;
          horas_json: Json | null;
          id: number;
          machine_id: number;
          resultados_json: Json | null;
          usuario_id: string | null;
        };
        Insert: {
          comentario?: string | null;
          fecha_calculo?: string | null;
          horas_json?: Json | null;
          id?: number;
          machine_id: number;
          resultados_json?: Json | null;
          usuario_id?: string | null;
        };
        Update: {
          comentario?: string | null;
          fecha_calculo?: string | null;
          horas_json?: Json | null;
          id?: number;
          machine_id?: number;
          resultados_json?: Json | null;
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posesion_historial_machine_id_fkey';
            columns: ['machine_id'];
            isOneToOne: false;
            referencedRelation: 'machines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posesion_historial_usuario_id_fkey';
            columns: ['usuario_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ratios_historico: {
        Row: {
          fecha_efectiva: string;
          id: number;
          modelo_id: number;
          tipo_ratio_id: number;
          valor: number | null;
        };
        Insert: {
          fecha_efectiva: string;
          id?: number;
          modelo_id: number;
          tipo_ratio_id: number;
          valor?: number | null;
        };
        Update: {
          fecha_efectiva?: string;
          id?: number;
          modelo_id?: number;
          tipo_ratio_id?: number;
          valor?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ratios_historico_modelo_id_fkey';
            columns: ['modelo_id'];
            isOneToOne: false;
            referencedRelation: 'modelos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ratios_historico_tipo_ratio_id_fkey';
            columns: ['tipo_ratio_id'];
            isOneToOne: false;
            referencedRelation: 'tipos_ratio';
            referencedColumns: ['id'];
          },
        ];
      };
      tipos_ratio: {
        Row: {
          categoria: Database['public']['Enums']['tipo_ratio_categoria'] | null;
          created_at: string | null;
          id: number;
          nombre: string;
        };
        Insert: {
          categoria?:
            | Database['public']['Enums']['tipo_ratio_categoria']
            | null;
          created_at?: string | null;
          id?: number;
          nombre: string;
        };
        Update: {
          categoria?:
            | Database['public']['Enums']['tipo_ratio_categoria']
            | null;
          created_at?: string | null;
          id?: number;
          nombre?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      tipo_ratio_categoria:
        | 'Preventivo'
        | 'Correctivo'
        | 'Neumaticos'
        | 'Estructural'
        | 'Desgaste';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : never;

export const Constants = {
  public: {
    Enums: {
      tipo_ratio_categoria: [
        'Preventivo',
        'Correctivo',
        'Neumaticos',
        'Estructural',
        'Desgaste',
      ],
    },
  },
} as const;
