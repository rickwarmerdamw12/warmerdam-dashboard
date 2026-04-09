'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import { Task, Client, TaskStatus } from '@/types'

const CLIENT_COLORS = [
  '#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6',
  '#F97316', '#06B6D4', '#84CC16', '#EF4444', '#A855F7',
]

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'moet_gebeuren', label: 'Moet gebeuren', color: '#EF4444' },
  { id: 'mee_bezig',     label: 'Mee bezig',     color: '#F59E0B' },
  { id: 'klaar',         label: 'Klaar',          color: '#10B981' },
]

// ─── Card visual (no hooks) ────────────────────────────────────────────────

function CardContent({
  task,
  clientColor,
  clientNaam,
  overlay = false,
}: {
  task: Task
  clientColor: string
  clientNaam: string
  overlay?: boolean
}) {
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'klaar'

  return (
    <div
      className={`bg-[#1E293B] border rounded-xl p-3 select-none transition-all duration-150 ${
        overlay
          ? 'border-amber-500/60 shadow-2xl shadow-black/50 rotate-1 scale-105'
          : 'border-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: clientColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm leading-snug">{task.title}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-slate-500 text-xs">{clientNaam}</span>
            {task.due_date && (
              <span
                className={`text-xs font-medium ${
                  isOverdue ? 'text-red-400' : 'text-slate-500'
                }`}
              >
                ·{' '}
                {new Date(task.due_date).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Draggable wrapper ─────────────────────────────────────────────────────

function DraggableCard({
  task,
  clientColor,
  clientNaam,
}: {
  task: Task
  clientColor: string
  clientNaam: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-20' : ''
      }`}
    >
      <CardContent task={task} clientColor={clientColor} clientNaam={clientNaam} />
    </div>
  )
}

// ─── Droppable column ──────────────────────────────────────────────────────

function DroppableColumn({
  column,
  tasks,
  clientColorMap,
  clientNameMap,
  onAddClick,
  addForm,
}: {
  column: (typeof COLUMNS)[0]
  tasks: Task[]
  clientColorMap: Record<string, string>
  clientNameMap: Record<string, string>
  onAddClick: () => void
  addForm: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex-1 flex flex-col min-w-[270px] max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-white text-sm">{column.label}</h3>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          title="Taak toevoegen"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-2 min-h-[300px] flex flex-col gap-2 transition-all duration-150 ${
          isOver
            ? 'bg-slate-700/50 ring-1 ring-slate-600'
            : 'bg-slate-800/30'
        }`}
      >
        {addForm}

        {tasks.length === 0 && !addForm && (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-xs pointer-events-none">
            Sleep hier naartoe
          </div>
        )}

        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            clientColor={clientColorMap[task.client_id] || '#64748B'}
            clientNaam={clientNameMap[task.client_id] || '?'}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Add task inline form ──────────────────────────────────────────────────

function AddTaskForm({
  clients,
  clientColorMap,
  defaultClientId,
  onSubmit,
  onCancel,
}: {
  clients: Client[]
  clientColorMap: Record<string, string>
  defaultClientId: string
  onSubmit: (title: string, clientId: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState(defaultClientId)

  return (
    <div className="bg-[#1E293B] border border-amber-500/40 rounded-xl p-3">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit(title, clientId)
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="Taaknaam..."
        className="w-full bg-transparent text-white text-sm placeholder-slate-500 outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="flex-1 bg-slate-900 text-slate-300 text-xs rounded-lg px-2 py-1.5 border border-slate-700 outline-none"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.naam}
            </option>
          ))}
        </select>
        <button
          onClick={() => onSubmit(title, clientId)}
          className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-colors"
        >
          Toevoegen
        </button>
        <button
          onClick={onCancel}
          className="w-7 h-7 rounded-lg bg-slate-700 text-slate-300 text-xs hover:bg-slate-600 transition-colors flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ─── Main board ────────────────────────────────────────────────────────────

export default function KanbanBoard({
  initialTasks,
  clients,
}: {
  initialTasks: Task[]
  clients: Client[]
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [addingStatus, setAddingStatus] = useState<TaskStatus | null>(null)

  const clientColorMap: Record<string, string> = Object.fromEntries(
    clients.map((c, i) => [c.id, CLIENT_COLORS[i % CLIENT_COLORS.length]])
  )
  const clientNameMap: Record<string, string> = Object.fromEntries(
    clients.map((c) => [c.id, c.naam])
  )

  const visibleTasks = selectedClient
    ? tasks.filter((t) => t.client_id === selectedClient)
    : tasks

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === active.id) || null)
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as TaskStatus
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )

    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId)

    // Revert on error
    if (error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      )
    }
  }

  const handleAddTask = async (title: string, clientId: string) => {
    if (!title.trim() || !clientId || !addingStatus) return
    setAddingStatus(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        status: addingStatus,
        client_id: clientId,
        position: tasks.length,
      })
      .select()
      .single()

    if (data && !error) {
      setTasks((prev) => [...prev, data as Task])
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 pb-28">
      {/* Client filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedClient(null)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            !selectedClient
              ? 'bg-amber-500 text-black'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Alle klanten
        </button>
        {clients.map((client, i) => {
          const color = CLIENT_COLORS[i % CLIENT_COLORS.length]
          const isActive = selectedClient === client.id
          return (
            <button
              key={client.id}
              onClick={() =>
                setSelectedClient(isActive ? null : client.id)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border-transparent'
              }`}
              style={
                isActive
                  ? { backgroundColor: color + '22', borderColor: color + '66', color: 'white' }
                  : {}
              }
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {client.naam.split(' ')[0]}
            </button>
          )
        })}
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {COLUMNS.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              tasks={visibleTasks.filter((t) => t.status === column.id)}
              clientColorMap={clientColorMap}
              clientNameMap={clientNameMap}
              onAddClick={() => setAddingStatus(column.id)}
              addForm={
                addingStatus === column.id ? (
                  <AddTaskForm
                    clients={clients}
                    clientColorMap={clientColorMap}
                    defaultClientId={
                      selectedClient || clients[0]?.id || ''
                    }
                    onSubmit={handleAddTask}
                    onCancel={() => setAddingStatus(null)}
                  />
                ) : null
              }
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTask && (
            <CardContent
              task={activeTask}
              clientColor={clientColorMap[activeTask.client_id] || '#64748B'}
              clientNaam={clientNameMap[activeTask.client_id] || '?'}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </main>
  )
}
