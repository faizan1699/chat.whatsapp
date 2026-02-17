import './globals.css'
import { Inter } from 'next/font/google'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'
import { ReduxProvider } from '@/store/Provider'
import CustomToaster from '@/components/global/CustomToast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Video Calling App',
  description: 'WebRTC video calling application',
  viewport: {
    width: 'device-width',
    initialScale: 1.0,
    maximumScale: 1.0,
    userScalable: false,
  },
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
        <CustomToaster />
      </body>
    </html>
  )
}