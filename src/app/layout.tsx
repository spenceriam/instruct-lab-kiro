import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Instruct-Lab | AI System Instruction Testing Platform',
  description: 'Test, evaluate, and optimize your AI system instructions across multiple models using OpenRouter\'s unified API with quantitative metrics.',
  keywords: ['AI', 'OpenRouter', 'System Instructions', 'Testing', 'Optimization', 'Machine Learning'],
  authors: [{ name: 'Kiro Hackathon Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#18181b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
