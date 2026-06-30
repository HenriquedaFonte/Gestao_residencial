const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    })
  } catch {
    // Silently fail — notification failure shouldn't break the app
  }
}

export async function notifyTaskCreated(
  taskTitle: string,
  assigneeName?: string
) {
  const who = assigneeName ? `(👤 ${assigneeName})` : '(sem responsável)'
  await sendTelegramMessage(
    `📋 <b>Nova tarefa criada!</b>\n\n<b>${taskTitle}</b>\n${who}`
  )
}

export async function notifyTaskCompleted(
  taskTitle: string,
  completedByName: string
) {
  await sendTelegramMessage(
    `✅ <b>${completedByName}</b> acabou de concluir:\n\n<i>${taskTitle}</i>`
  )
}

export async function notifyTaskUpdated(taskTitle: string) {
  await sendTelegramMessage(
    `✏️ <b>Tarefa atualizada:</b>\n\n<i>${taskTitle}</i>`
  )
}

export async function notifyEventCreated(
  eventTitle: string,
  date: string,
  time?: string | null
) {
  const when = time ? `${date} às ${time}` : date
  await sendTelegramMessage(
    `📅 <b>Novo evento adicionado!</b>\n\n<b>${eventTitle}</b>\n🗓 ${when}`
  )
}

export async function notifyEventUpdated(eventTitle: string) {
  await sendTelegramMessage(
    `✏️ <b>Evento atualizado:</b>\n\n<i>${eventTitle}</i>`
  )
}
