import './globals.css'

export const metadata = {
  title: 'BrainDump — Collect & Store Knowledge',
  description: 'Send anything to your personal AI memory system. Paste text, transcripts, PDFs — it all becomes searchable memory.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
