import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import KanbanBoard from './KanbanBoard'
import { Task, Client } from '@/types'

export default async function KanbanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, naam, active')
    .order('naam', { ascending: true })

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true })

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Header title="Kanban" />
      <KanbanBoard
        initialTasks={(tasks || []) as Task[]}
        clients={(clients || []) as Client[]}
      />
      <BottomNav active="kanban" />
    </div>
  )
}
