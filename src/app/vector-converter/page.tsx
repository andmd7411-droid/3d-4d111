'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VectorConverterPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to the static HTML app
        window.location.href = '/laser-engraving/index.html'
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
                <div className="text-4xl mb-4">⚙️</div>
                <p>Loading Laser Engraving App...</p>
            </div>
        </div>
    )
}
