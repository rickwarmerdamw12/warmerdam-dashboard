export type ContentStatus = 'concept' | 'in_review' | 'goedgekeurd' | 'gepubliceerd'
export type TaskStatus = 'moet_gebeuren' | 'mee_bezig' | 'klaar'

export interface Task {
  id: string
  client_id: string
  title: string
  status: TaskStatus
  position: number
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  naam: string
  active: boolean
  website_url: string | null
  cms_type: string | null
  wordpress_url: string | null
  telegram_chat_id: string | null
  created_at: string
}

export interface ClientService {
  id: string
  client_id: string
  service: string
  active: boolean
  frequency: string | null
  next_run: string | null
  created_at: string
}

export interface ContentItem {
  id: string
  client_id: string
  service: string | null
  title: string
  content: string
  meta_description: string | null
  keywords_used: string[] | null
  status: ContentStatus
  feedback: string | null
  created_at: string
  published_at: string | null
}

export interface ClientWithServices extends Client {
  client_services: ClientService[]
  content_items: ContentItem[]
}
