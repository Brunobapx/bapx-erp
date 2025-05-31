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
      clients: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          ie: string | null
          name: string
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
          city?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          name: string
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
          city?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ie?: string | null
          name?: string
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
            foreignKeyName: "delivery_routes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
            foreignKeyName: "financial_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
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
          seller: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
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
          order_number: string
          payment_method?: string | null
          payment_term?: string | null
          seller?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number | null
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
          seller?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
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
          created_at: string
          id: string
          notes: string | null
          packaged_at: string | null
          packaged_by: string | null
          packaging_number: string
          product_id: string
          product_name: string
          production_id: string
          quality_check: boolean | null
          quantity_packaged: number | null
          quantity_to_package: number
          status: Database["public"]["Enums"]["packaging_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          packaged_at?: string | null
          packaged_by?: string | null
          packaging_number: string
          product_id: string
          product_name: string
          production_id: string
          quality_check?: boolean | null
          quantity_packaged?: number | null
          quantity_to_package: number
          status?: Database["public"]["Enums"]["packaging_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          packaged_at?: string | null
          packaged_by?: string | null
          packaging_number?: string
          product_id?: string
          product_name?: string
          production_id?: string
          quality_check?: boolean | null
          quantity_packaged?: number | null
          quantity_to_package?: number
          status?: Database["public"]["Enums"]["packaging_status"] | null
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
          order_item_id: string
          product_id: string
          product_name: string
          production_number: string
          quantity_produced: number | null
          quantity_requested: number
          start_date: string | null
          status: Database["public"]["Enums"]["production_status"] | null
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
          order_item_id: string
          product_id: string
          product_name: string
          production_number: string
          quantity_produced?: number | null
          quantity_requested: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"] | null
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
          order_item_id?: string
          product_id?: string
          product_name?: string
          production_number?: string
          quantity_produced?: number | null
          quantity_requested?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_product_id_fkey"
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
          created_at: string
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
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          code?: string | null
          cofins?: string | null
          cost?: number | null
          created_at?: string
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
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          code?: string | null
          cofins?: string | null
          cost?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          phone: string | null
          position: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          client_id: string
          client_name: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          order_id: string
          payment_method: string | null
          payment_term: string | null
          sale_number: string
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
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          order_id: string
          payment_method?: string | null
          payment_term?: string | null
          sale_number: string
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
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          order_id?: string
          payment_method?: string | null
          payment_term?: string | null
          sale_number?: string
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
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      generate_sequence_number: {
        Args: { prefix: string; table_name: string; user_id: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_row_count: {
        Args: { table_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "admin" | "user"
      delivery_status:
        | "pending"
        | "in_transit"
        | "delivered"
        | "failed"
        | "cancelled"
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
    Enums: {
      app_role: ["master", "admin", "user"],
      delivery_status: [
        "pending",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
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
    },
  },
} as const
