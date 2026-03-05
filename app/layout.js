export const metadata = {
  title: 'BrainDump — Collect & Store Knowledge',
  description: 'Send anything to your personal AI memory system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
