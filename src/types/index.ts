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
  gsc_property: string | null
  sitemap_url: string | null
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

export type GscVerdict = 'PASS' | 'NEUTRAL' | 'PARTIAL' | 'FAIL' | 'VERDICT_UNSPECIFIED' | null

export interface GscInspection {
  id: number
  client_id: string
  snapshot_date: string
  url: string
  verdict: GscVerdict
  coverage_state: string | null
  indexing_state: string | null
  robots_txt_state: string | null
  page_fetch_state: string | null
  google_canonical: string | null
  user_canonical: string | null
  last_crawl_time: string | null
  raw_response: unknown
  inspected_at: string
}
