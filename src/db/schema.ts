import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  unique,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  assigneeId: integer('assignee_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  status: text('status', { enum: ['pending', 'completed'] })
    .default('pending')
    .notNull(),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurrenceType: text('recurrence_type', { enum: ['daily', 'weekly', 'monthly'] }),
  // Weekly: comma-separated day numbers "1,3,5" = Mon, Wed, Fri (0=Sun, 6=Sat)
  recurrenceDays: text('recurrence_days'),
  // Monthly: day of month (1–28)
  recurrenceMonthDay: integer('recurrence_month_day'),
  // Pontos ganhos ao concluir esta tarefa (definido na criação, herdado por instâncias geradas)
  points: integer('points').default(1).notNull(),
  parentTaskId: integer('parent_task_id'),
  scheduledDate: date('scheduled_date'),
  completedAt: timestamp('completed_at'),
  completedById: integer('completed_by_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  date: date('date').notNull(),
  time: text('time'),
  location: text('location'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const rewards = pgTable('rewards', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  month: text('month').notNull(), // YYYY-MM
  offeredById: integer('offered_by_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const monthlyWinners = pgTable(
  'monthly_winners',
  {
    id: serial('id').primaryKey(),
    month: text('month').notNull(), // YYYY-MM
    winnerId: integer('winner_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    isTie: boolean('is_tie').default(false).notNull(),
    totalPoints: integer('total_points').notNull(),
    finalizedAt: timestamp('finalized_at').defaultNow().notNull(),
  },
  (table) => [unique('monthly_winners_month_unique').on(table.month)]
)

// ─── Loja de prêmios (saldo vitalício de pontos, resgatável) ───────────────
export const prizes = pgTable('prizes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  pointsCost: integer('points_cost').notNull(),
  active: boolean('active').default(true).notNull(),
  createdById: integer('created_by_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const prizeRedemptions = pgTable('prize_redemptions', {
  id: serial('id').primaryKey(),
  prizeId: integer('prize_id').references(() => prizes.id, { onDelete: 'set null' }),
  // Snapshot at redemption time — survives edits/deletion of the prize itself
  prizeTitle: text('prize_title').notNull(),
  pointsCost: integer('points_cost').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert
export type MonthlyWinner = typeof monthlyWinners.$inferSelect
export type NewMonthlyWinner = typeof monthlyWinners.$inferInsert
export type Prize = typeof prizes.$inferSelect
export type NewPrize = typeof prizes.$inferInsert
export type PrizeRedemption = typeof prizeRedemptions.$inferSelect
export type NewPrizeRedemption = typeof prizeRedemptions.$inferInsert
