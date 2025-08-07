export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          account: string | null
          amount: number
          category: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          purchase_id: string | null
          status: string | null
          supplier_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          category?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_id?: string | null
          status?: string | null
          supplier_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_id?: string | null
          status?: string | null
          supplier_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_history: {
        Row: {
          created_at: string | null
          error_message: string | null
          filename: string
          id: string
          location: string | null
          metadata: Json | null
          size_bytes: number | null
          status: string
          total_records: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          filename: string
          id?: string
          location?: string | null
          metadata?: Json | null
          size_bytes?: number | null
          status?: string
          total_records?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          filename?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          size_bytes?: number | null
          status?: string
          total_records?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          bairro: string | null
          city: string | null
          cnpj: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          ie: string | null
          name: string
          number: string | null
          phone: string | null
          rg: string | null
          state: string | null
          type: string
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          bairro?: string | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          name: string
          number?: string | null
          phone?: string | null
          rg?: string | null
          state?: string | null
          type: string
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          bairro?: string | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          name?: string
          number?: string | null
          phone?: string | null
          rg?: string | null
          state?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      commission_payments: {
        Row: {
          accounts_payable_id: string | null
          commission_details: Json
          created_at: string
          due_date: string
          id: string
          order_ids: Json
          payment_number: string
          seller_id: string
          seller_name: string
          status: string
          total_commission: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accounts_payable_id?: string | null
          commission_details?: Json
          created_at?: string
          due_date: string
          id?: string
          order_ids?: Json
          payment_number: string
          seller_id: string
          seller_name: string
          status?: string
          total_commission?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accounts_payable_id?: string | null
          commission_details?: Json
          created_at?: string
          due_date?: string
          id?: string
          order_ids?: Json
          payment_number?: string
          seller_id?: string
          seller_name?: string
          status?: string
          total_commission?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conciliacoes: {
        Row: {
          created_at: string
          id: string
          id_lancamento_interno: string
          id_transacao_banco: string
          metodo_conciliacao: string
          tipo_lancamento: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_lancamento_interno: string
          id_transacao_banco: string
          metodo_conciliacao: string
          tipo_lancamento: string
        }
        Update: {
          created_at?: string
          id?: string
          id_lancamento_interno?: string
          id_transacao_banco?: string
          metodo_conciliacao?: string
          tipo_lancamento?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_id_transacao_banco_fkey"
            columns: ["id_transacao_banco"]
            isOneToOne: false
            referencedRelation: "extrato_bancario_importado"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_routes: {
        Row: {
          client_id: string
          client_name: string
          created_at: string
          delivery_address: string
          delivery_date: string | null
          driver_name: string | null
          id: string
          notes: string | null
          order_id: string
          route_number: string
          sale_id: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          tracking_number: string | null
          updated_at: string
          user_id: string
          vehicle_info: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          created_at?: string
          delivery_address: string
          delivery_date?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          order_id: string
          route_number: string
          sale_id: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          tracking_number?: string | null
          updated_at?: string
          user_id: string
          vehicle_info?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string
          delivery_address?: string
          delivery_date?: string | null
          driver_name?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          route_number?: string
          sale_id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
          vehicle_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_routes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_routes_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      extrato_bancario_importado: {
        Row: {
          arquivo_origem: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          status: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          arquivo_origem?: string | null
          created_at?: string
          data: string
          descricao: string
          id?: string
          status?: string
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          arquivo_origem?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          status?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          agency: string | null
          bank: string | null
          created_at: string | null
          id: string
          initial_balance: number | null
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_type: string
          agency?: string | null
          bank?: string | null
          created_at?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string
          agency?: string | null
          bank?: string | null
          created_at?: string | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          account: string | null
          amount: number
          category: string | null
          client_id: string | null
          created_at: string
          description: string
          due_date: string
          entry_number: string
          id: string
          invoice_number: string | null
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          sale_id: string | null
          type: Database["public"]["Enums"]["financial_entry_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          description: string
          due_date: string
          entry_number: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          sale_id?: string | null
          type: Database["public"]["Enums"]["financial_entry_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          entry_number?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          sale_id?: string | null
          type?: Database["public"]["Enums"]["financial_entry_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_invoices: {
        Row: {
          authorization_date: string | null
          client_id: string | null
          created_at: string
          danfe_url: string | null
          error_message: string | null
          focus_message: string | null
          focus_reference: string | null
          focus_response: Json | null
          focus_status: string | null
          id: string
          invoice_key: string | null
          invoice_number: string
          invoice_type: string
          issue_date: string
          observations: string | null
          order_id: string | null
          protocol_number: string | null
          sale_id: string | null
          series_number: number | null
          status: string
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
          xml_url: string | null
        }
        Insert: {
          authorization_date?: string | null
          client_id?: string | null
          created_at?: string
          danfe_url?: string | null
          error_message?: string | null
          focus_message?: string | null
          focus_reference?: string | null
          focus_response?: Json | null
          focus_status?: string | null
          id?: string
          invoice_key?: string | null
          invoice_number: string
          invoice_type?: string
          issue_date?: string
          observations?: string | null
          order_id?: string | null
          protocol_number?: string | null
          sale_id?: string | null
          series_number?: number | null
          status?: string
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
          xml_url?: string | null
        }
        Update: {
          authorization_date?: string | null
          client_id?: string | null
          created_at?: string
          danfe_url?: string | null
          error_message?: string | null
          focus_message?: string | null
          focus_reference?: string | null
          focus_response?: Json | null
          focus_status?: string | null
          id?: string
          invoice_key?: string | null
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          observations?: string | null
          order_id?: string | null
          protocol_number?: string | null
          sale_id?: string | null
          series_number?: number | null
          status?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      markup_settings: {
        Row: {
          created_at: string | null
          default_profit_margin: number
          fixed_expenses_percentage: number
          id: string
          updated_at: string | null
          variable_expenses_percentage: number
        }
        Insert: {
          created_at?: string | null
          default_profit_margin?: number
          fixed_expenses_percentage?: number
          id?: string
          updated_at?: string | null
          variable_expenses_percentage?: number
        }
        Update: {
          created_at?: string | null
          default_profit_margin?: number
          fixed_expenses_percentage?: number
          id?: string
          updated_at?: string | null
          variable_expenses_percentage?: number
        }
        Relationships: []
      }
      nota_configuracoes: {
        Row: {
          ambiente: string
          cfop_padrao: string | null
          cnpj_emissor: string
          cofins_percentual: number | null
          created_at: string
          csosn_padrao: string | null
          cst_padrao: string | null
          icms_percentual: number | null
          id: string
          pis_percentual: number | null
          regime_tributario: string | null
          tipo_empresa: string | null
          tipo_nota: string
          token_focus: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ambiente?: string
          cfop_padrao?: string | null
          cnpj_emissor: string
          cofins_percentual?: number | null
          created_at?: string
          csosn_padrao?: string | null
          cst_padrao?: string | null
          icms_percentual?: number | null
          id?: string
          pis_percentual?: number | null
          regime_tributario?: string | null
          tipo_empresa?: string | null
          tipo_nota?: string
          token_focus: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ambiente?: string
          cfop_padrao?: string | null
          cnpj_emissor?: string
          cofins_percentual?: number | null
          created_at?: string
          csosn_padrao?: string | null
          cst_padrao?: string | null
          icms_percentual?: number | null
          id?: string
          pis_percentual?: number | null
          regime_tributario?: string | null
          tipo_empresa?: string | null
          tipo_nota?: string
          token_focus?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nota_logs: {
        Row: {
          acao: string
          criado_em: string
          id: string
          mensagem: string | null
          nota_id: string | null
          resposta: Json | null
          status_code: number | null
        }
        Insert: {
          acao: string
          criado_em?: string
          id?: string
          mensagem?: string | null
          nota_id?: string | null
          resposta?: Json | null
          status_code?: number | null
        }
        Update: {
          acao?: string
          criado_em?: string
          id?: string
          mensagem?: string | null
          nota_id?: string | null
          resposta?: Json | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_logs_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas_emitidas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_emitidas: {
        Row: {
          chave_acesso: string | null
          created_at: string
          emitida_em: string
          focus_id: string | null
          id: string
          json_enviado: Json | null
          json_resposta: Json | null
          numero_nota: string | null
          pdf_url: string | null
          pedido_id: string | null
          serie: string | null
          status: string | null
          tipo_nota: string
          updated_at: string
          user_id: string
          xml_url: string | null
        }
        Insert: {
          chave_acesso?: string | null
          created_at?: string
          emitida_em?: string
          focus_id?: string | null
          id?: string
          json_enviado?: Json | null
          json_resposta?: Json | null
          numero_nota?: string | null
          pdf_url?: string | null
          pedido_id?: string | null
          serie?: string | null
          status?: string | null
          tipo_nota: string
          updated_at?: string
          user_id: string
          xml_url?: string | null
        }
        Update: {
          chave_acesso?: string | null
          created_at?: string
          emitida_em?: string
          focus_id?: string | null
          id?: string
          json_enviado?: Json | null
          json_resposta?: Json | null
          numero_nota?: string | null
          pdf_url?: string | null
          pedido_id?: string | null
          serie?: string | null
          status?: string | null
          tipo_nota?: string
          updated_at?: string
          user_id?: string
          xml_url?: string | null
        }
        Relationships: []
      }
      order_item_tracking: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_item_id: string
          quantity_from_production: number
          quantity_from_stock: number
          quantity_packaged_approved: number
          quantity_produced_approved: number
          quantity_target: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_item_id: string
          quantity_from_production?: number
          quantity_from_stock?: number
          quantity_packaged_approved?: number
          quantity_produced_approved?: number
          quantity_target?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_item_id?: string
          quantity_from_production?: number
          quantity_from_stock?: number
          quantity_packaged_approved?: number
          quantity_produced_approved?: number
          quantity_target?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_item_tracking_order_items"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_items_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string
          client_name: string
          created_at: string
          delivery_deadline: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_term: string | null
          seller_id: string | null
          seller_name: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          client_name: string
          created_at?: string
          delivery_deadline?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_term?: string | null
          seller_id?: string | null
          seller_name?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string
          delivery_deadline?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_term?: string | null
          seller_id?: string | null
          seller_name?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          packaged_at: string | null
          packaged_by: string | null
          packaging_number: string
          product_id: string
          product_name: string
          production_id: string | null
          quality_check: boolean | null
          quantity_packaged: number | null
          quantity_to_package: number
          status: Database["public"]["Enums"]["packaging_status"] | null
          tracking_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          packaged_at?: string | null
          packaged_by?: string | null
          packaging_number: string
          product_id: string
          product_name: string
          production_id?: string | null
          quality_check?: boolean | null
          quantity_packaged?: number | null
          quantity_to_package: number
          status?: Database["public"]["Enums"]["packaging_status"] | null
          tracking_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          packaged_at?: string | null
          packaged_by?: string | null
          packaging_number?: string
          product_id?: string
          product_name?: string
          production_id?: string | null
          quality_check?: boolean | null
          quantity_packaged?: number | null
          quantity_to_package?: number
          status?: Database["public"]["Enums"]["packaging_status"] | null
          tracking_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "production"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "order_item_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_terms: {
        Row: {
          created_at: string | null
          days: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      perdas: {
        Row: {
          created_at: string
          custo_estimado: number | null
          data_perda: string
          id: string
          motivo: string
          observacoes: string | null
          produto_id: string
          quantidade: number
          referencia_troca_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo_estimado?: number | null
          data_perda?: string
          id?: string
          motivo: string
          observacoes?: string | null
          produto_id: string
          quantidade: number
          referencia_troca_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custo_estimado?: number | null
          data_perda?: string
          id?: string
          motivo?: string
          observacoes?: string | null
          produto_id?: string
          quantidade?: number
          referencia_troca_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perdas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perdas_referencia_troca_id_fkey"
            columns: ["referencia_troca_id"]
            isOneToOne: false
            referencedRelation: "trocas"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          product_id: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completion_date: string | null
          created_at: string
          id: string
          notes: string | null
          order_item_id: string | null
          product_id: string
          product_name: string
          production_number: string
          quantity_produced: number | null
          quantity_requested: number
          start_date: string | null
          status: Database["public"]["Enums"]["production_status"] | null
          tracking_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_id: string
          product_name: string
          production_number: string
          quantity_produced?: number | null
          quantity_requested: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"] | null
          tracking_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completion_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_item_id?: string | null
          product_id?: string
          product_name?: string
          production_number?: string
          quantity_produced?: number | null
          quantity_requested?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"] | null
          tracking_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "order_item_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          code: string | null
          cofins: string | null
          commission_type: string | null
          commission_value: number | null
          cost: number | null
          created_at: string
          description: string | null
          icms: string | null
          id: string
          ipi: string | null
          is_active: boolean
          is_direct_sale: boolean
          is_manufactured: boolean | null
          is_service: boolean
          name: string
          ncm: string | null
          pis: string | null
          price: number | null
          sku: string | null
          stock: number | null
          tax_type: string | null
          unit: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          cofins?: string | null
          commission_type?: string | null
          commission_value?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          icms?: string | null
          id?: string
          ipi?: string | null
          is_active?: boolean
          is_direct_sale?: boolean
          is_manufactured?: boolean | null
          is_service?: boolean
          name: string
          ncm?: string | null
          pis?: string | null
          price?: number | null
          sku?: string | null
          stock?: number | null
          tax_type?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          category?: string | null
          code?: string | null
          cofins?: string | null
          commission_type?: string | null
          commission_value?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          icms?: string | null
          id?: string
          ipi?: string | null
          is_active?: boolean
          is_direct_sale?: boolean
          is_manufactured?: boolean | null
          is_service?: boolean
          name?: string
          ncm?: string | null
          pis?: string | null
          price?: number | null
          sku?: string | null
          stock?: number | null
          tax_type?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string
          id: string
          ncm: string | null
          product_code: string | null
          product_id: string | null
          product_name: string
          purchase_id: string
          quantity: number
          total_price: number
          unit: string | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ncm?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name: string
          purchase_id: string
          quantity: number
          total_price: number
          unit?: string | null
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ncm?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string
          purchase_id?: string
          quantity?: number
          total_price?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          invoice_date: string
          invoice_key: string | null
          invoice_number: string
          notes: string | null
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string
          vendor_id: string | null
          vendor_name: string
          xml_content: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_date: string
          invoice_key?: string | null
          invoice_number: string
          notes?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vendor_name: string
          xml_content?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_date?: string
          invoice_key?: string | null
          invoice_number?: string
          notes?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vendor_name?: string
          xml_content?: string | null
        }
        Relationships: []
      }
      route_assignments: {
        Row: {
          created_at: string
          driver_name: string | null
          estimated_distance: number | null
          estimated_time: number | null
          id: string
          route_name: string
          status: string | null
          total_capacity_used: number | null
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_name?: string | null
          estimated_distance?: number | null
          estimated_time?: number | null
          id?: string
          route_name: string
          status?: string | null
          total_capacity_used?: number | null
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_name?: string | null
          estimated_distance?: number | null
          estimated_time?: number | null
          id?: string
          route_name?: string
          status?: string | null
          total_capacity_used?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      route_items: {
        Row: {
          client_name: string
          created_at: string
          delivery_address: string
          estimated_delivery_time: string | null
          id: string
          order_id: string
          route_assignment_id: string
          sequence_order: number | null
          status: string | null
          total_weight: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name: string
          created_at?: string
          delivery_address: string
          estimated_delivery_time?: string | null
          id?: string
          order_id: string
          route_assignment_id: string
          sequence_order?: number | null
          status?: string | null
          total_weight?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string
          created_at?: string
          delivery_address?: string
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string
          route_assignment_id?: string
          sequence_order?: number | null
          status?: string | null
          total_weight?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_items_route_assignment_id_fkey"
            columns: ["route_assignment_id"]
            isOneToOne: false
            referencedRelation: "route_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string
          client_name: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          order_id: string
          original_amount: number | null
          payment_method: string | null
          payment_term: string | null
          sale_number: string
          salesperson_id: string | null
          status: Database["public"]["Enums"]["sale_status"] | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          client_name: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          order_id: string
          original_amount?: number | null
          payment_method?: string | null
          payment_term?: string | null
          sale_number: string
          salesperson_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          client_name?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          order_id?: string
          original_amount?: number | null
          payment_method?: string | null
          payment_term?: string | null
          sale_number?: string
          salesperson_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"] | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seller_commissions: {
        Row: {
          commission_type: string
          commission_value: number
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_type?: string
          commission_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_type?: string
          commission_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_order_attachments: {
        Row: {
          file_name: string | null
          file_url: string
          id: string
          service_order_id: string
          uploaded_at: string
        }
        Insert: {
          file_name?: string | null
          file_url: string
          id?: string
          service_order_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string | null
          file_url?: string
          id?: string
          service_order_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_attachments_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_materials: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          service_order_id: string
          subtotal: number | null
          unit_value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          service_order_id: string
          subtotal?: number | null
          unit_value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          service_order_id?: string
          subtotal?: number | null
          unit_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_materials_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          client_id: string
          contract_service: boolean
          created_at: string
          description: string | null
          id: string
          notes: string | null
          opened_at: string
          os_number: string
          priority: string
          receivable_id: string | null
          service_type: string
          service_value: number | null
          status: string
          technician_id: string
          total_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          contract_service?: boolean
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          os_number: string
          priority: string
          receivable_id?: string | null
          service_type: string
          service_value?: number | null
          status?: string
          technician_id: string
          total_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          contract_service?: boolean
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          opened_at?: string
          os_number?: string
          priority?: string
          receivable_id?: string | null
          service_type?: string
          service_value?: number | null
          status?: string
          technician_id?: string
          total_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          new_stock: number
          previous_stock: number
          product_id: string
          product_name: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: string
          new_stock?: number
          previous_stock?: number
          product_id: string
          product_name: string
          quantity: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          new_stock?: number
          previous_stock?: number
          product_id?: string
          product_name?: string
          quantity?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_modules: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          route_path: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          route_path: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          route_path?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      system_sub_modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_module_id: string
          sort_order: number | null
          tab_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_module_id: string
          sort_order?: number | null
          tab_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_module_id?: string
          sort_order?: number | null
          tab_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent_module"
            columns: ["parent_module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      troca_itens: {
        Row: {
          created_at: string
          id: string
          motivo: string
          observacoes_item: string | null
          produto_devolvido_id: string
          produto_novo_id: string
          quantidade: number
          troca_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string
          observacoes_item?: string | null
          produto_devolvido_id: string
          produto_novo_id: string
          quantidade: number
          troca_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string
          observacoes_item?: string | null
          produto_devolvido_id?: string
          produto_novo_id?: string
          quantidade?: number
          troca_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "troca_itens_produto_devolvido_id_fkey"
            columns: ["produto_devolvido_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "troca_itens_produto_novo_id_fkey"
            columns: ["produto_novo_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "troca_itens_troca_id_fkey"
            columns: ["troca_id"]
            isOneToOne: false
            referencedRelation: "trocas"
            referencedColumns: ["id"]
          },
        ]
      }
      trocas: {
        Row: {
          cliente_id: string
          created_at: string
          data_finalizacao: string | null
          data_troca: string
          id: string
          numero_troca: string | null
          observacoes: string | null
          recebido_por: string | null
          responsavel: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_finalizacao?: string | null
          data_troca?: string
          id?: string
          numero_troca?: string | null
          observacoes?: string | null
          recebido_por?: string | null
          responsavel: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_finalizacao?: string | null
          data_troca?: string
          id?: string
          numero_troca?: string | null
          observacoes?: string | null
          recebido_por?: string | null
          responsavel?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trocas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_departments: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department_type"]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department_type"]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department_type"]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          created_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_positions: {
        Row: {
          created_at: string | null
          id: string
          position: Database["public"]["Enums"]["user_position_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position: Database["public"]["Enums"]["user_position_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: Database["public"]["Enums"]["user_position_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tab_permissions: {
        Row: {
          created_at: string
          id: string
          sub_module_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sub_module_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sub_module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sub_module"
            columns: ["sub_module_id"]
            isOneToOne: false
            referencedRelation: "system_sub_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string
          driver_name: string | null
          id: string
          license_plate: string
          model: string
          notes: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          driver_name?: string | null
          id?: string
          license_plate: string
          model: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          driver_name?: string | null
          id?: string
          license_plate?: string
          model?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_sequence_number: {
        Args: { prefix: string; table_name: string; user_id: string }
        Returns: string
      }
      get_row_count: {
        Args: { table_name: string }
        Returns: number
      }
      get_technicians: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
          email: string
        }[]
      }
      has_module_permission: {
        Args: { user_id: string; module_route: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_seller: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_user_id: string
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_details?: Json
        }
        Returns: undefined
      }
      validate_cnpj: {
        Args: { cnpj: string }
        Returns: boolean
      }
      validate_company_access: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      validate_cpf: {
        Args: { cpf: string }
        Returns: boolean
      }
    }
    Enums: {
      delivery_status:
        | "pending"
        | "in_transit"
        | "delivered"
        | "failed"
        | "cancelled"
      department_type:
        | "financeiro"
        | "vendas"
        | "producao"
        | "compras"
        | "estoque"
        | "rh"
        | "ti"
        | "diretoria"
        | "administrativo"
      financial_entry_type: "receivable" | "payable"
      order_status:
        | "pending"
        | "in_production"
        | "in_packaging"
        | "packaged"
        | "released_for_sale"
        | "sale_confirmed"
        | "in_delivery"
        | "delivered"
        | "cancelled"
      packaging_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      production_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
      sale_status: "pending" | "confirmed" | "invoiced" | "cancelled"
      user_position_type:
        | "vendedor"
        | "administrativo"
        | "entregador"
        | "gerente"
        | "financeiro"
        | "producao"
        | "estoque"
        | "tecnico"
      user_type: "admin" | "user" | "master" | "seller"
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
      delivery_status: [
        "pending",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
      ],
      department_type: [
        "financeiro",
        "vendas",
        "producao",
        "compras",
        "estoque",
        "rh",
        "ti",
        "diretoria",
        "administrativo",
      ],
      financial_entry_type: ["receivable", "payable"],
      order_status: [
        "pending",
        "in_production",
        "in_packaging",
        "packaged",
        "released_for_sale",
        "sale_confirmed",
        "in_delivery",
        "delivered",
        "cancelled",
      ],
      packaging_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      production_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
      ],
      sale_status: ["pending", "confirmed", "invoiced", "cancelled"],
      user_position_type: [
        "vendedor",
        "administrativo",
        "entregador",
        "gerente",
        "financeiro",
        "producao",
        "estoque",
        "tecnico",
      ],
      user_type: ["admin", "user", "master", "seller"],
    },
  },
} as const
