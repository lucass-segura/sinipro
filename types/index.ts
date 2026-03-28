// ─── Core entities ───────────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface Client {
  id: string
  full_name: string
  phone?: string
  email?: string
  locality?: string
  dni?: string
  address?: string
  birth_date?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface Policy {
  id: string
  client_id: string
  company_id: string
  branch: PolicyBranch
  vehicle_plate?: string
  policy_number?: string
  first_payment_date: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  clients?: Client
  companies?: Company
}

export type PolicyBranch =
  | 'Automotores'
  | 'Motovehiculos'
  | 'Responsabilidad civil'
  | 'Hogar'
  | 'Comercio'
  | 'Vida'
  | 'Accidentes Personales'
  | 'Otro'

export const POLICY_BRANCHES: PolicyBranch[] = [
  'Automotores',
  'Motovehiculos',
  'Responsabilidad civil',
  'Hogar',
  'Comercio',
  'Vida',
  'Accidentes Personales',
  'Otro',
]

export const VEHICLE_BRANCHES: PolicyBranch[] = ['Automotores', 'Motovehiculos']

// ─── Notices ─────────────────────────────────────────────────────────────────

export type NoticeStatus = 'avisar' | 'avisado' | 'pagado'

export interface Note {
  id: string
  note: string
  user_id: string
  created_at?: string
  user_profiles: { display_name: string } | null
}

export interface ReminderLog {
  id: string
  notice_id: string
  sent_by: string
  channel: 'whatsapp' | 'email' | 'manual'
  sent_at: string
  recipient_phone?: string
  recipient_email?: string
  message_preview?: string
  user_profiles?: { display_name: string } | null
}

export interface PolicyNotice {
  id: string
  due_date: string
  status: NoticeStatus
  paid_installments: number
  notified_by?: string | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
  policies: {
    id: string
    branch: PolicyBranch
    vehicle_plate?: string
    policy_number?: string
    first_payment_date: string
    is_active?: boolean
    clients: {
      id: string
      full_name: string
      phone?: string
      email?: string
      locality?: string
      dni?: string
      notes?: string | null
    }
    companies: { id: string; name: string }
  }
  notice_notes?: Note[]
  reminder_logs?: ReminderLog[]
}

// ─── Notices filters ──────────────────────────────────────────────────────────

export interface NoticeFilters {
  search?: string
  clientId?: string
  policyNumber?: string
  vehiclePlate?: string
  companyId?: string
  branch?: PolicyBranch | ''
  status?: NoticeStatus | 'todos'
  dateFrom?: string
  dateTo?: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  overdueNotices: number
  upcomingNotices: number
  notifiedNoPay: number
  paidThisMonth: number
  activePolicies: number
  activeClients: number
}

// ─── Future modules ───────────────────────────────────────────────────────────

export type SiniestroEstado = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado'

export interface Siniestro {
  id: string
  policy_id?: string
  client_id?: string
  company_id?: string
  numero_siniestro?: string
  fecha_ocurrencia?: string
  fecha_denuncia?: string
  tipo?: string
  descripcion?: string
  estado: SiniestroEstado
  monto_estimado?: number
  created_at?: string
  updated_at?: string
}

export interface Document {
  id: string
  entity_type: 'policy' | 'client' | 'siniestro' | 'notice'
  entity_id: string
  uploaded_by?: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  created_at?: string
}

export interface InternalMessage {
  id: string
  from_user?: string
  to_user?: string
  subject?: string
  body?: string
  is_read: boolean
  entity_type?: 'policy' | 'client' | 'siniestro' | 'notice'
  entity_id?: string
  created_at?: string
}
