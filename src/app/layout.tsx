import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '旅行團收支管理',
  description: '旅行團收支管理系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
