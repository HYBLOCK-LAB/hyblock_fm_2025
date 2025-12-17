import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HyBlock Quiz DApp',
  description: 'Blockchain-based Quiz Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  )
}