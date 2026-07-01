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
