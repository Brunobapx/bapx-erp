export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          bank_name: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_reconciliations: {
        Row: {
          bank_account_id: string
          created_at: string | null
          file_name: string | null
          file_path: string | null
          id: string
          notes: string | null
          reconciliation_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_account_id: string
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          reconciliation_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_account_id?: string
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          reconciliation_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          ie: string | null
          name: string
          phone: string | null
          rg: string | null
          state: string | null
          type: string
          updated_at: string | null
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          ie?: string | null
          name: string
          phone?: string | null
          rg?: string | null
          state?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          ie?: string | null
          name?: string
          phone?: string | null
          rg?: string | null
          state?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          account: string | null
          amount: number
          category: string | null
          created_at: string | null
          description: string
          id: string
          payment_status: string | null
          reference_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          payment_status?: string | null
          reference_id?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          payment_status?: string | null
          reference_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          client_id: string
          client_name: string
          created_at: string | null
          delivery_deadline: string | null
          id: string
          payment_method: string | null
          product_id: string
          product_name: string
          quantity: number
          seller: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          client_name: string
          created_at?: string | null
          delivery_deadline?: string | null
          id?: string
          payment_method?: string | null
          product_id: string
          product_name: string
          quantity?: number
          seller?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string | null
          delivery_deadline?: string | null
          id?: string
          payment_method?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          seller?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_recipes: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string
          product_id: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id: string
          product_id: string
          quantity: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
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
      products: {
        Row: {
          category: string | null
          code: string | null
          cofins: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          icms: string | null
          id: string
          ipi: string | null
          is_manufactured: boolean | null
          name: string
          ncm: string | null
          pis: string | null
          price: number | null
          sku: string | null
          stock: number | null
          tax_type: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          cofins?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          icms?: string | null
          id?: string
          ipi?: string | null
          is_manufactured?: boolean | null
          name: string
          ncm?: string | null
          pis?: string | null
          price?: number | null
          sku?: string | null
          stock?: number | null
          tax_type?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          code?: string | null
          cofins?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          icms?: string | null
          id?: string
          ipi?: string | null
          is_manufactured?: boolean | null
          name?: string
          ncm?: string | null
          pis?: string | null
          price?: number | null
          sku?: string | null
          stock?: number | null
          tax_type?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_row_count: {
        Args: { table_name: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
