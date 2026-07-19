'use server'

import { db } from '@/db'
import { tasks, events, users, rewards, monthlyWinners, prizes, prizeRedemptions, Task, User } from '@/db/schema'
import { eq, and, isNull, isNotNull, inArray, gte, lte, gt, lt, asc, desc, sum } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { revalidatePath } from 'next/cache'
import {
  notifyTaskCreated,
  notifyTaskCompleted,
  notifyTaskUpdated,
  notifyEventCreated,
  notifyEventUpdated,
  notifyPrizeRedeemed,
  sendTelegramMessage,
} from './telegram'
import { getCurrentWeekDayNumbers, getWeekDates, getTodayDateString, getMonthRangeUtc } from './utils'

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
  // Independent of each other — run in parallel instead of one after another
  await Promise.all([generateRecurringInstances(), finalizeMonthlyWinnerIfNeeded()])

  const weekDates = getWeekDates()
  const endOfWeek = weekDates[weekDates.length - 1]

  // These three queries don't depend on each other's results either
  const [oneOffTasks, recurringToday, upcomingThisWeek] = await Promise.all([
    // One-off tasks that are pending (no scheduledDate or scheduled for today/past)
    db
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
      .orderBy(asc(tasks.createdAt)),

    // Today's recurring instances (all statuses — completed ones show as crossed out)
    db
      .select({ task: tasks, user: users })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(and(eq(tasks.scheduledDate, today), isNotNull(tasks.parentTaskId)))
      .orderBy(asc(tasks.status), asc(tasks.createdAt)),

    // Upcoming recurring instances for the rest of the current week
    today < endOfWeek
      ? db
          .select({ task: tasks, user: users })
          .from(tasks)
          .leftJoin(users, eq(tasks.assigneeId, users.id))
          .where(
            and(
              isNotNull(tasks.parentTaskId),
              gt(tasks.scheduledDate, today),
              lte(tasks.scheduledDate, endOfWeek)
            )
          )
          .orderBy(asc(tasks.scheduledDate), asc(tasks.createdAt))
      : Promise.resolve([] as { task: Task; user: User | null }[]),
  ])

  return { oneOffTasks, recurringToday, upcomingThisWeek }
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
  const recurrenceType = (formData.get('recurrenceType') as 'daily' | 'weekly' | 'monthly' | null) ?? 'weekly'
  const recurrenceDays = formData.get('recurrenceDays') as string | null
  const recurrenceMonthDay = formData.get('recurrenceMonthDay')
    ? Number(formData.get('recurrenceMonthDay'))
    : null
  const points = Math.min(20, Math.max(1, Number(formData.get('points')) || 1))

  const [newTask] = await db
    .insert(tasks)
    .values({
      title,
      description: description || null,
      assigneeId,
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : null,
      recurrenceDays: isRecurring && recurrenceType === 'weekly' ? recurrenceDays : null,
      recurrenceMonthDay: isRecurring && recurrenceType === 'monthly' ? recurrenceMonthDay : null,
      points,
    })
    .returning()

  if (isRecurring) {
    if (recurrenceType === 'daily') {
      await generateInstancesForTask(newTask, '0,1,2,3,4,5,6')
    } else if (recurrenceType === 'monthly' && recurrenceMonthDay) {
      await generateMonthlyInstanceForTask(newTask, recurrenceMonthDay)
    } else {
      await generateInstancesForTask(newTask, recurrenceDays || '')
    }
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
  const recurrenceType = (formData.get('recurrenceType') as 'daily' | 'weekly' | 'monthly' | null) ?? 'weekly'
  const recurrenceDays = formData.get('recurrenceDays') as string | null
  const recurrenceMonthDay = formData.get('recurrenceMonthDay')
    ? Number(formData.get('recurrenceMonthDay'))
    : null
  const points = Math.min(20, Math.max(1, Number(formData.get('points')) || 1))

  await db
    .update(tasks)
    .set({
      title,
      description: description || null,
      assigneeId,
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : null,
      recurrenceDays: isRecurring && recurrenceType === 'weekly' ? recurrenceDays : null,
      recurrenceMonthDay: isRecurring && recurrenceType === 'monthly' ? recurrenceMonthDay : null,
      points,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))

  // Propagate the new points value to already-generated instances that
  // haven't been completed yet (completed instances keep their historical points)
  await db
    .update(tasks)
    .set({ points, updatedAt: new Date() })
    .where(and(eq(tasks.parentTaskId, id), eq(tasks.status, 'pending')))

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

// Completes a copy of a recurring task today, without touching the original —
// works both from an already-generated future instance (e.g. under "Esta
// Semana") and directly from the recurring template (e.g. when the scheduled
// day is too far ahead to have generated an instance yet). Either way, the
// original stays untouched: the future instance stays pending on its own day,
// and the template keeps generating its regular instances normally.
export async function bringTaskForward(taskId: number, completedByName: string, completedById?: number) {
  const [source] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!source) return

  // Instance: link the clone to the same series via its parentTaskId.
  // Template: it IS the series, so link the clone to the template's own id.
  const parentTaskId = source.parentTaskId ?? (source.isRecurring ? source.id : null)
  if (!parentTaskId) return

  const today = getTodayDateString()

  const [clone] = await db
    .insert(tasks)
    .values({
      title: source.title,
      description: source.description,
      assigneeId: source.assigneeId,
      status: 'completed',
      isRecurring: false,
      parentTaskId,
      scheduledDate: today,
      points: source.points,
      completedAt: new Date(),
      completedById: completedById ?? null,
    })
    .returning()

  if (clone) {
    await notifyTaskCompleted(clone.title, completedByName)
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

// Inserts missing instances for `parent` in a single existence-check query plus
// a single bulk insert, instead of one round trip per candidate date.
async function insertMissingInstances(parent: Task, dates: string[]) {
  if (dates.length === 0) return

  const existing = await db
    .select({ scheduledDate: tasks.scheduledDate })
    .from(tasks)
    .where(and(eq(tasks.parentTaskId, parent.id), inArray(tasks.scheduledDate, dates)))

  const existingDates = new Set(existing.map((e) => e.scheduledDate))
  const missingDates = dates.filter((d) => !existingDates.has(d))
  if (missingDates.length === 0) return

  await db.insert(tasks).values(
    missingDates.map((date) => ({
      title: parent.title,
      description: parent.description,
      assigneeId: parent.assigneeId,
      status: 'pending' as const,
      isRecurring: false,
      parentTaskId: parent.id,
      scheduledDate: date,
      points: parent.points,
    }))
  )
}

async function generateInstancesForTask(parent: Task, recurrenceDaysStr: string) {
  if (!recurrenceDaysStr) return

  const days = recurrenceDaysStr.split(',').map(Number)
  const dates = getCurrentWeekDayNumbers()
    .filter(({ day }) => days.includes(day))
    .map(({ date }) => date)

  await insertMissingInstances(parent, dates)
}

async function generateMonthlyInstanceForTask(parent: Task, dayOfMonth: number) {
  const today = getTodayDateString()
  const [year, month, todayDay] = today.split('-').map(Number)

  const candidates: string[] = []
  // Always generate current month's instance
  candidates.push(`${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`)
  // If today is on or past the scheduled day, also prepare next month
  if (todayDay >= dayOfMonth) {
    const nm = month === 12 ? 1 : month + 1
    const ny = month === 12 ? year + 1 : year
    candidates.push(`${ny}-${String(nm).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`)
  }

  // Validate each date actually exists (e.g. day 30 in February is invalid)
  const dates = candidates.filter((date) => {
    const d = new Date(date + 'T12:00:00Z')
    return !isNaN(d.getTime()) && d.getUTCDate() === dayOfMonth
  })

  await insertMissingInstances(parent, dates)
}

export async function generateRecurringInstances() {
  const recurringTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.isRecurring, true), isNull(tasks.parentTaskId)))

  // Independent per template — run concurrently instead of one after another
  await Promise.all(
    recurringTasks.map((task) => {
      if (task.recurrenceType === 'daily') {
        return generateInstancesForTask(task, '0,1,2,3,4,5,6')
      } else if (task.recurrenceType === 'monthly' && task.recurrenceMonthDay) {
        return generateMonthlyInstanceForTask(task, task.recurrenceMonthDay)
      } else {
        return generateInstancesForTask(task, task.recurrenceDays || '')
      }
    })
  )
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
  const { start, end } = getMonthRangeUtc(year, month)

  const rows = await db
    .select({
      completedById: tasks.completedById,
      points: tasks.points,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'completed'),
        isNotNull(tasks.completedById),
        gte(tasks.completedAt, start),
        lt(tasks.completedAt, end)
      )
    )

  const allUsers = await db.select().from(users).orderBy(asc(users.id))

  return allUsers.map((user) => {
    const userRows = rows.filter((r) => r.completedById === user.id)
    const total = userRows.reduce((sum, r) => sum + r.points, 0)
    return { user, total }
  })
}

export async function getTaskHistory(year: number, month: number, userId?: number) {
  const { start, end } = getMonthRangeUtc(year, month)
  const parentTask = alias(tasks, 'parent_task')

  const conditions = [
    eq(tasks.status, 'completed'),
    isNotNull(tasks.completedAt),
    gte(tasks.completedAt, start),
    lt(tasks.completedAt, end),
  ] as Parameters<typeof and>

  if (userId) {
    conditions.push(eq(tasks.completedById, userId))
  }

  return db
    .select({
      task: tasks,
      completedBy: users,
      parentRecurrenceType: parentTask.recurrenceType,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.completedById, users.id))
    .leftJoin(parentTask, eq(tasks.parentTaskId, parentTask.id))
    .where(and(...conditions))
    .orderBy(desc(tasks.completedAt))
}

export async function getMonthlyWinner(month: string) {
  const result = await db
    .select({ winner: monthlyWinners, user: users })
    .from(monthlyWinners)
    .leftJoin(users, eq(monthlyWinners.winnerId, users.id))
    .where(eq(monthlyWinners.month, month))
    .limit(1)
  return result[0] ?? null
}

// Runs on every dashboard load. Once a new month has started, locks in the
// previous month's winner (idempotent via the unique constraint on `month`)
// and announces it on Telegram.
export async function finalizeMonthlyWinnerIfNeeded() {
  const today = getTodayDateString()
  const [year, month] = today.split('-').map(Number)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const monthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

  const existing = await db
    .select()
    .from(monthlyWinners)
    .where(eq(monthlyWinners.month, monthKey))
    .limit(1)
  if (existing.length > 0) return

  const scores = await getMonthlyScores(prevYear, prevMonth)
  const total = scores.reduce((sum, s) => sum + s.total, 0)
  if (total === 0) return // nothing completed last month — nothing to finalize yet

  const topScore = Math.max(...scores.map((s) => s.total))
  const topScorers = scores.filter((s) => s.total === topScore)
  const isTie = topScorers.length > 1

  const [inserted] = await db
    .insert(monthlyWinners)
    .values({
      month: monthKey,
      winnerId: isTie ? null : topScorers[0].user.id,
      isTie,
      totalPoints: topScore,
    })
    .onConflictDoNothing({ target: monthlyWinners.month })
    .returning()

  if (!inserted) return // already finalized by a concurrent request

  if (isTie) {
    await sendTelegramMessage(
      `🏆 <b>Empate no mês de ${monthKey}!</b>\n\nNinguém levou o prêmio dessa vez — ambos fizeram ${topScore} pontos.`
    )
  } else {
    await sendTelegramMessage(
      `🏆 <b>Vencedor do mês definido!</b>\n\n<b>${topScorers[0].user.name}</b> venceu ${monthKey} com ${topScore} pontos! 🎉`
    )
  }

  revalidatePath('/scores')
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

// ─── Loja de Prêmios (saldo vitalício de pontos) ──────────────────────────────

export async function getLifetimeBalances() {
  const allUsers = await db.select().from(users).orderBy(asc(users.id))

  const earnedRows = await db
    .select({ userId: tasks.completedById, earned: sum(tasks.points) })
    .from(tasks)
    .where(and(eq(tasks.status, 'completed'), isNotNull(tasks.completedById)))
    .groupBy(tasks.completedById)

  const spentRows = await db
    .select({ userId: prizeRedemptions.userId, spent: sum(prizeRedemptions.pointsCost) })
    .from(prizeRedemptions)
    .groupBy(prizeRedemptions.userId)

  return allUsers.map((user) => {
    const earned = Number(earnedRows.find((r) => r.userId === user.id)?.earned ?? 0)
    const spent = Number(spentRows.find((r) => r.userId === user.id)?.spent ?? 0)
    return { user, earned, spent, balance: earned - spent }
  })
}

export async function getPrizes() {
  return db.select().from(prizes).orderBy(asc(prizes.pointsCost))
}

export async function createPrize(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const pointsCost = Math.max(1, Number(formData.get('pointsCost')) || 1)
  const createdById = formData.get('createdById')
    ? Number(formData.get('createdById'))
    : null

  await db.insert(prizes).values({
    title,
    description: description || null,
    pointsCost,
    createdById,
  })

  revalidatePath('/store')
}

export async function togglePrizeActive(id: number, active: boolean) {
  await db.update(prizes).set({ active }).where(eq(prizes.id, id))
  revalidatePath('/store')
}

export async function deletePrize(id: number) {
  await db.delete(prizes).where(eq(prizes.id, id))
  revalidatePath('/store')
}

export async function redeemPrize(
  prizeId: number,
  userId: number,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const [prize] = await db.select().from(prizes).where(eq(prizes.id, prizeId)).limit(1)
  if (!prize || !prize.active) {
    return { success: false, error: 'Este prêmio não está mais disponível.' }
  }

  const balances = await getLifetimeBalances()
  const balance = balances.find((b) => b.user.id === userId)?.balance ?? 0

  if (balance < prize.pointsCost) {
    return { success: false, error: 'Saldo de pontos insuficiente.' }
  }

  await db.insert(prizeRedemptions).values({
    prizeId: prize.id,
    prizeTitle: prize.title,
    pointsCost: prize.pointsCost,
    userId,
  })

  await notifyPrizeRedeemed(userName, prize.title, prize.pointsCost)

  revalidatePath('/store')
  revalidatePath('/scores')

  return { success: true }
}

export async function getRedemptionHistory(limit = 30) {
  return db
    .select({ redemption: prizeRedemptions, user: users })
    .from(prizeRedemptions)
    .leftJoin(users, eq(prizeRedemptions.userId, users.id))
    .orderBy(desc(prizeRedemptions.redeemedAt))
    .limit(limit)
}
