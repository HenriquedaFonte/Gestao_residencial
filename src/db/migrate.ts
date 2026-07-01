import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql)

  console.log('Criando tabelas...')

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
      is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
      recurrence_days TEXT,
      parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      scheduled_date DATE,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      time TEXT,
      location TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `

  // Add new columns to tasks if not exists
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL`
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_type TEXT`
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_month_day INTEGER`

  // Rewards table
  await sql`
    CREATE TABLE IF NOT EXISTS rewards (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      month TEXT NOT NULL,
      offered_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `

  // Monthly winners table
  await sql`
    CREATE TABLE IF NOT EXISTS monthly_winners (
      id SERIAL PRIMARY KEY,
      month TEXT NOT NULL,
      winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_tie BOOLEAN NOT NULL DEFAULT FALSE,
      total_points INTEGER NOT NULL,
      finalized_at TIMESTAMP DEFAULT NOW() NOT NULL,
      CONSTRAINT monthly_winners_month_unique UNIQUE (month)
    )
  `

  // Seed users
  await sql`
    INSERT INTO users (name)
    SELECT name FROM (VALUES ('Henrique'), ('Josiane')) AS t(name)
    WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1)
  `

  console.log('✅ Banco de dados configurado com sucesso!')
  console.log('   Tabelas: users, tasks, events, rewards, monthly_winners')
  console.log('   Usuários: Henrique (id=1), Josiane (id=2)')
}

main().catch((err) => {
  console.error('❌ Erro ao configurar banco:', err)
  process.exit(1)
})
