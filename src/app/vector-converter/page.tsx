'use client'

import { useEffect } from 'react'

export default function VectorConverterPage() {
    useEffect(() => {
        // Redirect to the laser engraving app using the relative path from basePath
        window.location.href = '/3d-4d/laser-engraving/index.html'
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
            <div className="text-white text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-6 mx-auto"></div>
                <h2 className="text-2xl font-bold mb-2 text-blue-400">Loading Laser Engraving Studio</h2>
                <p className="text-gray-400">Please wait while we prepare your creative space...</p>
            </div>
        </div>
    )
}
