import './globals.css'

// Next.js metadata export is allowed alongside components
export const metadata = {
  title: 'Martinez Auto Detail - Car Wash Appointments',
  description: 'Book your professional car detailing appointment online',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}