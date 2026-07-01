'use server'

import { db } from '@/db'
import { tasks, events, users, rewards } from '@/db/schema'
import { eq, and, isNull, isNotNull, gte, lte, asc, count, sql as drizzleSql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  notifyTaskCreated,
  notifyTaskCompleted,
  notifyTaskUpdated,
  notifyEventCreated,
  notifyEventUpdated,
} from './telegram'
import { getCurrentWeekDayNumbers, getTodayDateString } from './utils'

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers() {
  return db.select().from(users).orderBy(asc(users.id))
}

export async function seedUsers() {
  const existing = await db.select().from(users)
  if (existing.length === 0) {
    await db
      .insert(users)
      .values([{ name: 'Henrique' }, { name: 'Josiane' }])
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTodayTasks() {
  const today = getTodayDateString()
  await generateRecurringInstances()
  return db
    .select({ task: tasks, user: users })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(and(eq(tasks.scheduledDate, today), isNotNull(tasks.parentTaskId)))
    .orderBy(asc(tasks.status), asc(tasks.createdAt))
  // Also get non-recurring tasks without a date (one-off tasks created today)
}

export async function getAllTasks() {
  return db
    .select({ task: tasks, user: users })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(isNull(tasks.parentTaskId))
    .orderBy(asc(tasks.status), asc(tasks.createdAt))
}

export async function getTasksForDashboard() {
  const today = getTodayDateString()
  await generateRecurringInstances()

  // One-off tasks that are pending (no scheduledDate or scheduled for today/past)
  const oneOffTasks = await db
    .select({ task: tasks, user: users })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(
      and(
        eq(tasks.isRecurring, false),
        isNull(tasks.parentTaskId),
        eq(tasks.status, 'pending')
      )
    )
    .orderBy(asc(tasks.createdAt))

  // Today's recurring instances (pending only — completed ones are hidden like one-off tasks)
  const recurringToday = await db
    .select({ task: tasks, user: users })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(and(eq(tasks.scheduledDate, today), eq(tasks.status, 'pending')))
    .orderBy(asc(tasks.createdAt))

  return { oneOffTasks, recurringToday }
}

export async function getTaskById(id: number) {
  const result = await db
    .select({ task: tasks, user: users })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(tasks.id, id))
    .limit(1)
  return result[0] ?? null
}

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const assigneeId = formData.get('assigneeId')
    ? Number(formData.get('assigneeId'))
    : null
  const isRecurring = formData.get('isRecurring') === 'true'
  const recurrenceDays = formData.get('recurrenceDays') as string | null

  const [newTask] = await db
    .insert(tasks)
    .values({
      title,
      description: description || null,
      assigneeId,
      isRecurring,
      recurrenceDays: isRecurring ? recurrenceDays : null,
    })
    .returning()

  if (isRecurring) {
    await generateInstancesForTask(newTask.id, recurrenceDays || '')
  }

  let assigneeName: string | undefined
  if (assigneeId) {
    const [u] = await db.select().from(users).where(eq(users.id, assigneeId))
    assigneeName = u?.name
  }

  await notifyTaskCreated(title, assigneeName)
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/tasks')
}

export async function updateTask(id: number, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const assigneeId = formData.get('assigneeId')
    ? Number(formData.get('assigneeId'))
    : null
  const isRecurring = formData.get('isRecurring') === 'true'
  const recurrenceDays = formData.get('recurrenceDays') as string | null

  await db
    .update(tasks)
    .set({
      title,
      description: description || null,
      assigneeId,
      isRecurring,
      recurrenceDays: isRecurring ? recurrenceDays : null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))

  await notifyTaskUpdated(title)
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/tasks')
}

export async function completeTask(id: number, completedByName: string, completedById?: number) {
  const result = await db
    .update(tasks)
    .set({
      status: 'completed',
      completedAt: new Date(),
      completedById: completedById ?? null,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning()

  if (result[0]) {
    await notifyTaskCompleted(result[0].title, completedByName)
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/tasks')
  revalidatePath('/scores')
}

export async function reopenTask(id: number) {
  await db
    .update(tasks)
    .set({ status: 'pending', completedAt: null, completedById: null, updatedAt: new Date() })
    .where(eq(tasks.id, id))

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/tasks')
  revalidatePath('/scores')
}

export async function deleteTask(id: number) {
  // Delete instances first
  await db.delete(tasks).where(eq(tasks.parentTaskId, id))
  await db.delete(tasks).where(eq(tasks.id, id))

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/tasks')
}

// ─── Recurring Task Instances ─────────────────────────────────────────────────

async function generateInstancesForTask(
  parentId: number,
  recurrenceDaysStr: string
) {
  if (!recurrenceDaysStr) return

  const days = recurrenceDaysStr.split(',').map(Number)
  const weekDates = getCurrentWeekDayNumbers()

  const parent = await db.select().from(tasks).where(eq(tasks.id, parentId)).limit(1)
  if (!parent[0]) return

  for (const { date, day } of weekDates) {
    if (!days.includes(day)) continue

    const existing = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parentTaskId, parentId), eq(tasks.scheduledDate, date)))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(tasks).values({
        title: parent[0].title,
        description: parent[0].description,
        assigneeId: parent[0].assigneeId,
        status: 'pending',
        isRecurring: false,
        parentTaskId: parentId,
        scheduledDate: date,
      })
    }
  }
}

export async function generateRecurringInstances() {
  const recurringTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.isRecurring, true), isNull(tasks.parentTaskId)))

  for (const task of recurringTasks) {
    await generateInstancesForTask(task.id, task.recurrenceDays || '')
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getUpcomingEvents(limit = 10) {
  const today = getTodayDateString()
  return db
    .select()
    .from(events)
    .where(gte(events.date, today))
    .orderBy(asc(events.date))
    .limit(limit)
}

export async function getAllEvents() {
  return db.select().from(events).orderBy(asc(events.date))
}

export async function getEventById(id: number) {
  const result = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
  return result[0] ?? null
}

export async function createEvent(formData: FormData) {
  const title = formData.get('title') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string | null
  const location = formData.get('location') as string | null
  const notes = formData.get('notes') as string | null

  await db.insert(events).values({
    title,
    date,
    time: time || null,
    location: location || null,
    notes: notes || null,
  })

  await notifyEventCreated(title, date, time)
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/events')
}

export async function updateEvent(id: number, formData: FormData) {
  const title = formData.get('title') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string | null
  const location = formData.get('location') as string | null
  const notes = formData.get('notes') as string | null

  await db
    .update(events)
    .set({
      title,
      date,
      time: time || null,
      location: location || null,
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))

  await notifyEventUpdated(title)
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/events')
}

export async function deleteEvent(id: number) {
  await db.delete(events).where(eq(events.id, id))
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/events')
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export async function getMonthlyScores(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`

  const rows = await db
    .select({
      completedById: tasks.completedById,
      total: count(),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'completed'),
        isNotNull(tasks.completedById),
        gte(tasks.completedAt, new Date(start)),
        lte(tasks.completedAt, new Date(end))
      )
    )
    .groupBy(tasks.completedById)

  const allUsers = await db.select().from(users).orderBy(asc(users.id))

  return allUsers.map((user) => {
    const row = rows.find((r) => r.completedById === user.id)
    return { user, total: Number(row?.total ?? 0) }
  })
}

// ─── Rewards ──────────────────────────────────────────────────────────────────

export async function getRewards(month: string) {
  return db
    .select({ reward: rewards, user: users })
    .from(rewards)
    .leftJoin(users, eq(rewards.offeredById, users.id))
    .where(eq(rewards.month, month))
    .orderBy(asc(rewards.createdAt))
}

export async function createReward(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const month = formData.get('month') as string
  const offeredById = formData.get('offeredById')
    ? Number(formData.get('offeredById'))
    : null

  await db.insert(rewards).values({
    title,
    description: description || null,
    month,
    offeredById,
  })

  revalidatePath('/scores')
}

export async function deleteReward(id: number) {
  await db.delete(rewards).where(eq(rewards.id, id))
  revalidatePath('/scores')
}
