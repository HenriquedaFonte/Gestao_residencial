import type { Metadata, Viewport } from 'next'
import { Newsreader, Hanken_Grotesk } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/components/UserContext'
import { BottomNav } from '@/components/BottomNav'
import { AppGuard } from '@/components/AppGuard'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Casa Arrumada',
  description: 'Gerencie tarefas e eventos domésticos com Henrique e Josiane',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Casa Arrumada',
  },
}

export const viewport: Viewport = {
  themeColor: '#C2683F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`h-full ${newsreader.variable} ${hankenGrotesk.variable}`}>
      <body className="h-full bg-paper">
        <ServiceWorkerRegistration />
        <UserProvider>
          <AppGuard>
            <main className="min-h-screen pb-20">{children}</main>
            <BottomNav />
          </AppGuard>
        </UserProvider>
      </body>
    </html>
  )
}
