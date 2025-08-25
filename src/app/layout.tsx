import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Comet - Document Signing Platform",
  description: "Secure document signing with PDF upload and electronic signatures",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
