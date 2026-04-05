import './globals.css'
import { Inter } from 'next/font/google'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'
import { ReduxProvider } from '@/store/Provider'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { Toaster } from 'react-hot-toast'

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
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </ReduxProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {/* <CookieConsentBanner /> */}
      </body>
    </html>
  )
}