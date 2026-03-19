import './globals.css'

export const metadata = {
  title: 'GardenVision AI — See your garden transformed',
  description: 'Upload a photo of your garden and explore a professionally inspired landscaping concept in minutes.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
