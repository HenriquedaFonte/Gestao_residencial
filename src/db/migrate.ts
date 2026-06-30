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

  // Seed users
  await sql`
    INSERT INTO users (name)
    SELECT name FROM (VALUES ('Henrique'), ('Josiane')) AS t(name)
    WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1)
  `

  console.log('✅ Banco de dados configurado com sucesso!')
  console.log('   Tabelas: users, tasks, events')
  console.log('   Usuários: Henrique (id=1), Josiane (id=2)')
}

main().catch((err) => {
  console.error('❌ Erro ao configurar banco:', err)
  process.exit(1)
})
