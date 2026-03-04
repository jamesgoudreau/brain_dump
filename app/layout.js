import './globals.css'

export const metadata = {
  title: 'Open Brain — Onboarding',
  description: 'Seed your personal AI memory system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
