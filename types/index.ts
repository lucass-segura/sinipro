// src/types/notices.ts
export interface Note {
    id: string
    note: string
    user_id: string
    created_at?: string
    user_profiles: {
      display_name: string
    } | null
  }
  
  export interface PolicyNotice {
    id: string
    due_date: string
    status: "avisar" | "avisado" | "pagado"
    paid_installments: number
    notified_by?: string | null
    policies: {
      id: string
      branch: string
      vehicle_plate?: string
      first_payment_date: string
      clients: {
        id: string
        full_name: string
        phone?: string
        email?: string
        locality?: string
      }
      companies: {
        id: string
        name: string
      }
    }
    notice_notes: Note[]
  }
  