import './globals.css'
import { Inter } from 'next/font/google'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'
import { ReduxProvider } from '@/store/Provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Video Calling App',
  description: 'WebRTC video calling application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
        <CookieConsentBanner />
      </body>
    </html>
  )
}