export const metadata = {
  title: '收支管理系統',
  description: '簡單的收支追蹤工具',
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
