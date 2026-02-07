import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Professional File Conversion Studio',
    description: 'Convert images to 3D/4D models, vectorize photos, and transform files between formats with professional-grade tools',
    keywords: ['file conversion', '3D converter', 'STL', 'DXF', 'BMP', 'image to 3D', 'vector conversion'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
