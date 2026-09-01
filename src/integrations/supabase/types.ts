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
      arquivos_externos: {
        Row: {
          created_at: string
          destino: string
          entidade: string
          entidade_id: string | null
          enviado_por: string
          id: string
          nome_arquivo: string
          pasta: string
          tamanho_bytes: number | null
          updated_at: string
          web_url: string | null
        }
        Insert: {
          created_at?: string
          destino?: string
          entidade: string
          entidade_id?: string | null
          enviado_por: string
          id?: string
          nome_arquivo: string
          pasta: string
          tamanho_bytes?: number | null
          updated_at?: string
          web_url?: string | null
        }
        Update: {
          created_at?: string
          destino?: string
          entidade?: string
          entidade_id?: string | null
          enviado_por?: string
          id?: string
          nome_arquivo?: string
          pasta?: string
          tamanho_bytes?: number | null
          updated_at?: string
          web_url?: string | null
        }
        Relationships: []
      }
      atividade_evidencias: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          arquivo_url: string
          atividade_id: string
          descricao: string | null
          enviado_em: string
          enviado_por: string
          id: string
          tipo: Database["public"]["Enums"]["evidencia_tipo"]
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_url: string
          atividade_id: string
          descricao?: string | null
          enviado_em?: string
          enviado_por: string
          id?: string
          tipo: Database["public"]["Enums"]["evidencia_tipo"]
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_url?: string
          atividade_id?: string
          descricao?: string | null
          enviado_em?: string
          enviado_por?: string
          id?: string
          tipo?: Database["public"]["Enums"]["evidencia_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "atividade_evidencias_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          aberta_em: string
          aberta_por: string
          ativo_afetado: string | null
          chamado_itsm: string | null
          chamado_itsm_cache: Json | null
          chamados_itsm: string[]
          chamados_itsm_cache: Json
          codigo: number
          criticidade: Database["public"]["Enums"]["criticidade"]
          custo: number | null
          descricao: string | null
          email_enviado_em: string | null
          fechada_em: string | null
          fornecedor_id: string | null
          garantia_ate: string | null
          id: string
          janela_fim: string | null
          janela_inicio: string | null
          nota_fiscal_url: string | null
          numero_os_fornecedor: string | null
          status: Database["public"]["Enums"]["atividade_status"]
          tipo: Database["public"]["Enums"]["atividade_tipo"]
          titulo: string
          updated_at: string
        }
        Insert: {
          aberta_em?: string
          aberta_por: string
          ativo_afetado?: string | null
          chamado_itsm?: string | null
          chamado_itsm_cache?: Json | null
          chamados_itsm?: string[]
          chamados_itsm_cache?: Json
          codigo?: number
          criticidade?: Database["public"]["Enums"]["criticidade"]
          custo?: number | null
          descricao?: string | null
          email_enviado_em?: string | null
          fechada_em?: string | null
          fornecedor_id?: string | null
          garantia_ate?: string | null
          id?: string
          janela_fim?: string | null
          janela_inicio?: string | null
          nota_fiscal_url?: string | null
          numero_os_fornecedor?: string | null
          status?: Database["public"]["Enums"]["atividade_status"]
          tipo: Database["public"]["Enums"]["atividade_tipo"]
          titulo: string
          updated_at?: string
        }
        Update: {
          aberta_em?: string
          aberta_por?: string
          ativo_afetado?: string | null
          chamado_itsm?: string | null
          chamado_itsm_cache?: Json | null
          chamados_itsm?: string[]
          chamados_itsm_cache?: Json
          codigo?: number
          criticidade?: Database["public"]["Enums"]["criticidade"]
          custo?: number | null
          descricao?: string | null
          email_enviado_em?: string | null
          fechada_em?: string | null
          fornecedor_id?: string | null
          garantia_ate?: string | null
          id?: string
          janela_fim?: string | null
          janela_inicio?: string | null
          nota_fiscal_url?: string | null
          numero_os_fornecedor?: string | null
          status?: Database["public"]["Enums"]["atividade_status"]
          tipo?: Database["public"]["Enums"]["atividade_tipo"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          apolice_seguro: string | null
          ativo: boolean
          avaliacao_media: number | null
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          documento: string | null
          id: string
          razao_social: string
          seguro_validade: string | null
          tarefas_autorizadas: string | null
          updated_at: string
          validade_credencial: string | null
        }
        Insert: {
          apolice_seguro?: string | null
          ativo?: boolean
          avaliacao_media?: number | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          documento?: string | null
          id?: string
          razao_social: string
          seguro_validade?: string | null
          tarefas_autorizadas?: string | null
          updated_at?: string
          validade_credencial?: string | null
        }
        Update: {
          apolice_seguro?: string | null
          ativo?: boolean
          avaliacao_media?: number | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          documento?: string | null
          id?: string
          razao_social?: string
          seguro_validade?: string | null
          tarefas_autorizadas?: string | null
          updated_at?: string
          validade_credencial?: string | null
        }
        Relationships: []
      }
      integracoes_config: {
        Row: {
          atualizado_por: string | null
          chave: string
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          atualizado_por?: string | null
          chave: string
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          atualizado_por?: string | null
          chave?: string
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          assunto: string | null
          canal: string
          corpo: string | null
          destinatario: string
          enviado_em: string
          id: string
          referencia_id: string | null
          referencia_tipo: string | null
          regra: string
        }
        Insert: {
          assunto?: string | null
          canal?: string
          corpo?: string | null
          destinatario: string
          enviado_em?: string
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          regra: string
        }
        Update: {
          assunto?: string | null
          canal?: string
          corpo?: string | null
          destinatario?: string
          enviado_em?: string
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          regra?: string
        }
        Relationships: []
      }
      passagem_pendencias: {
        Row: {
          created_at: string
          descricao: string
          id: string
          passagem_id: string
          prazo: string | null
          resolvida: boolean
          responsavel: string | null
          risco: Database["public"]["Enums"]["criticidade"]
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          passagem_id: string
          prazo?: string | null
          resolvida?: boolean
          responsavel?: string | null
          risco?: Database["public"]["Enums"]["criticidade"]
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          passagem_id?: string
          prazo?: string | null
          resolvida?: boolean
          responsavel?: string | null
          risco?: Database["public"]["Enums"]["criticidade"]
        }
        Relationships: [
          {
            foreignKeyName: "passagem_pendencias_passagem_id_fkey"
            columns: ["passagem_id"]
            isOneToOne: false
            referencedRelation: "passagens_turno"
            referencedColumns: ["id"]
          },
        ]
      }
      passagens_turno: {
        Row: {
          aceito_em: string | null
          chamados_itsm: string[]
          chamados_itsm_cache: Json
          contingencia_ativa: boolean
          contingencia_descricao: string | null
          created_at: string
          data: string
          id: string
          incidentes_ativos: string | null
          mudancas_realizadas: string | null
          operador_entrega_id: string
          operador_recebe_id: string | null
          prazo_aceite: string
          status_aceite: Database["public"]["Enums"]["aceite_status"]
          status_servicos_tier0: string | null
          status_sistemas: string | null
          turno: string
          updated_at: string
        }
        Insert: {
          aceito_em?: string | null
          chamados_itsm?: string[]
          chamados_itsm_cache?: Json
          contingencia_ativa?: boolean
          contingencia_descricao?: string | null
          created_at?: string
          data?: string
          id?: string
          incidentes_ativos?: string | null
          mudancas_realizadas?: string | null
          operador_entrega_id: string
          operador_recebe_id?: string | null
          prazo_aceite?: string
          status_aceite?: Database["public"]["Enums"]["aceite_status"]
          status_servicos_tier0?: string | null
          status_sistemas?: string | null
          turno: string
          updated_at?: string
        }
        Update: {
          aceito_em?: string | null
          chamados_itsm?: string[]
          chamados_itsm_cache?: Json
          contingencia_ativa?: boolean
          contingencia_descricao?: string | null
          created_at?: string
          data?: string
          id?: string
          incidentes_ativos?: string | null
          mudancas_realizadas?: string | null
          operador_entrega_id?: string
          operador_recebe_id?: string | null
          prazo_aceite?: string
          status_aceite?: Database["public"]["Enums"]["aceite_status"]
          status_servicos_tier0?: string | null
          status_sistemas?: string | null
          turno?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          grupo_ad: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string
          grupo_ad?: string | null
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          grupo_ad?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      regras_escalonamento: {
        Row: {
          ativa: boolean
          canal: string
          created_at: string
          criticidade_minima: Database["public"]["Enums"]["criticidade"] | null
          destinatarios: string
          evento: string
          id: string
          nivel: number
          notificar_coordenadores: boolean
          notificar_gestores: boolean
          observacao: string | null
          prazo_minutos: number
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          canal?: string
          created_at?: string
          criticidade_minima?: Database["public"]["Enums"]["criticidade"] | null
          destinatarios: string
          evento: string
          id?: string
          nivel?: number
          notificar_coordenadores?: boolean
          notificar_gestores?: boolean
          observacao?: string | null
          prazo_minutos?: number
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          canal?: string
          created_at?: string
          criticidade_minima?: Database["public"]["Enums"]["criticidade"] | null
          destinatarios?: string
          evento?: string
          id?: string
          nivel?: number
          notificar_coordenadores?: boolean
          notificar_gestores?: boolean
          observacao?: string | null
          prazo_minutos?: number
          updated_at?: string
        }
        Relationships: []
      }
      relatorios_mensais: {
        Row: {
          arquivo_pdf_url: string | null
          conteudo: Json | null
          destinatarios: string | null
          gerado_em: string
          id: string
          periodo_referencia: string
          tipo: string
        }
        Insert: {
          arquivo_pdf_url?: string | null
          conteudo?: Json | null
          destinatarios?: string | null
          gerado_em?: string
          id?: string
          periodo_referencia: string
          tipo: string
        }
        Update: {
          arquivo_pdf_url?: string | null
          conteudo?: Json | null
          destinatarios?: string | null
          gerado_em?: string
          id?: string
          periodo_referencia?: string
          tipo?: string
        }
        Relationships: []
      }
      ronda_itens: {
        Row: {
          created_at: string
          criticidade: Database["public"]["Enums"]["criticidade"] | null
          foto_url: string | null
          id: string
          item: string
          observacao: string | null
          ronda_id: string
          secao: string
          status: Database["public"]["Enums"]["item_status"]
        }
        Insert: {
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade"] | null
          foto_url?: string | null
          id?: string
          item: string
          observacao?: string | null
          ronda_id: string
          secao: string
          status?: Database["public"]["Enums"]["item_status"]
        }
        Update: {
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade"] | null
          foto_url?: string | null
          id?: string
          item?: string
          observacao?: string | null
          ronda_id?: string
          secao?: string
          status?: Database["public"]["Enums"]["item_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ronda_itens_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "rondas"
            referencedColumns: ["id"]
          },
        ]
      }
      rondas: {
        Row: {
          chamado_itsm: string | null
          chamado_itsm_cache: Json | null
          chamados_itsm: string[]
          chamados_itsm_cache: Json
          created_at: string
          data: string
          finalizada: boolean
          id: string
          localidade: string
          observacoes: string | null
          responsavel_id: string
          resultado_geral: Database["public"]["Enums"]["criticidade"]
          ronda_anterior_id: string | null
          temperatura: number | null
          total_nc: number
          turno: string
          umidade: number | null
          updated_at: string
        }
        Insert: {
          chamado_itsm?: string | null
          chamado_itsm_cache?: Json | null
          chamados_itsm?: string[]
          chamados_itsm_cache?: Json
          created_at?: string
          data?: string
          finalizada?: boolean
          id?: string
          localidade?: string
          observacoes?: string | null
          responsavel_id: string
          resultado_geral?: Database["public"]["Enums"]["criticidade"]
          ronda_anterior_id?: string | null
          temperatura?: number | null
          total_nc?: number
          turno: string
          umidade?: number | null
          updated_at?: string
        }
        Update: {
          chamado_itsm?: string | null
          chamado_itsm_cache?: Json | null
          chamados_itsm?: string[]
          chamados_itsm_cache?: Json
          created_at?: string
          data?: string
          finalizada?: boolean
          id?: string
          localidade?: string
          observacoes?: string | null
          responsavel_id?: string
          resultado_geral?: Database["public"]["Enums"]["criticidade"]
          ronda_anterior_id?: string | null
          temperatura?: number | null
          total_nc?: number
          turno?: string
          umidade?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rondas_ronda_anterior_id_fkey"
            columns: ["ronda_anterior_id"]
            isOneToOne: false
            referencedRelation: "rondas"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_membros: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          ordem: number
          papel_turno: string
          turno_id: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          ordem?: number
          papel_turno?: string
          turno_id: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          ordem?: number
          papel_turno?: string
          turno_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_membros_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos_equipe"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_equipe: {
        Row: {
          ativo: boolean
          coordenadores: string | null
          created_at: string
          grupo_ad: string | null
          id: string
          turno: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          coordenadores?: string | null
          created_at?: string
          grupo_ad?: string | null
          id?: string
          turno: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          coordenadores?: string | null
          created_at?: string
          grupo_ad?: string | null
          id?: string
          turno?: string
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      visitas: {
        Row: {
          acompanhante_id: string | null
          atividade_id: string | null
          checkin_em: string
          checkout_em: string | null
          consentimento_lgpd: boolean
          created_at: string
          documento: string | null
          duracao_prevista_min: number
          fornecedor_id: string | null
          foto_documento_url: string | null
          id: string
          motivo_visita: string | null
          pessoa_nome: string
          placa_veiculo: string | null
          registrado_por: string
          tipo_documento: string | null
          updated_at: string
          zona: string
        }
        Insert: {
          acompanhante_id?: string | null
          atividade_id?: string | null
          checkin_em?: string
          checkout_em?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          documento?: string | null
          duracao_prevista_min?: number
          fornecedor_id?: string | null
          foto_documento_url?: string | null
          id?: string
          motivo_visita?: string | null
          pessoa_nome: string
          placa_veiculo?: string | null
          registrado_por: string
          tipo_documento?: string | null
          updated_at?: string
          zona?: string
        }
        Update: {
          acompanhante_id?: string | null
          atividade_id?: string | null
          checkin_em?: string
          checkout_em?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          documento?: string | null
          duracao_prevista_min?: number
          fornecedor_id?: string | null
          foto_documento_url?: string | null
          id?: string
          motivo_visita?: string | null
          pessoa_nome?: string
          placa_veiculo?: string | null
          registrado_por?: string
          tipo_documento?: string | null
          updated_at?: string
          zona?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
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
      is_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      aceite_status: "pendente" | "aceito" | "escalonado"
      app_role: "operador" | "gestor" | "super_admin"
      atividade_status:
        | "aberta"
        | "agendada"
        | "em_execucao"
        | "aguardando_fechamento"
        | "fechada"
        | "cancelada"
      atividade_tipo: "preventiva" | "corretiva" | "troca_peca" | "instalacao"
      criticidade: "baixa" | "media" | "alta" | "critica"
      evidencia_tipo: "antes" | "depois" | "laudo"
      item_status: "C" | "NC" | "NA"
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
      aceite_status: ["pendente", "aceito", "escalonado"],
      app_role: ["operador", "gestor", "super_admin"],
      atividade_status: [
        "aberta",
        "agendada",
        "em_execucao",
        "aguardando_fechamento",
        "fechada",
        "cancelada",
      ],
      atividade_tipo: ["preventiva", "corretiva", "troca_peca", "instalacao"],
      criticidade: ["baixa", "media", "alta", "critica"],
      evidencia_tipo: ["antes", "depois", "laudo"],
      item_status: ["C", "NC", "NA"],
    },
  },
} as const
