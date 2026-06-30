import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Lazy initialization — avoids crashing at build time when DATABASE_URL is absent
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    _db = drizzle(neon(process.env.DATABASE_URL), { schema })
  }
  return _db
}

// Proxy so existing `import { db }` calls still work
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop: string) {
    return getDb()[prop as keyof ReturnType<typeof getDb>]
  },
})
