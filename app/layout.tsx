import CustomToaster from '@/components/global/CustomToast';
import './globals.css';
import { Inter } from 'next/font/google';

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
        {children}
        <CustomToaster />
      </body>
    </html>
  )
}
