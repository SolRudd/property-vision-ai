import './globals.css'
import './gardenvision.css'
import { getSiteMetadata } from '../lib/siteConfig'

export const metadata = getSiteMetadata()

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
