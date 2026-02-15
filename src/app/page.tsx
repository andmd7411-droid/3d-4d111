'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { AuthModal } from '@/components/AuthModal'

export default function HomePage() {
    const { user, logout } = useAuth()
    const [hoveredSection, setHoveredSection] = useState<number | null>(null)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

    const sections = [
        {
            id: 1,
            title: 'Image to 3D/4D Converter',
            description: 'Transform JPG, PNG, BMP images into stunning 3D and 4D STL models',
            features: ['Depth Map Generation', '3D Model Preview', 'Advanced Editing Tools', '4D Morphing System', 'STL Export'],
            gradient: 'gradient-section1',
            href: '/3d-converter',
            icon: '🎨'
        },
        {
            id: 2,
            title: 'Laser Engraving Studio',
            description: 'Professional laser engraving and DXF path optimization tools',
            features: ['High-Quality BMP Export', 'Precision DXF Vectorization', 'Image Editing Suite', 'Edge Detection', 'Path Optimization'],
            gradient: 'gradient-section2',
            href: '/laser-engraving/index.html',
            icon: '📐'
        },
        {
            id: 3,
            title: 'Universal File Converter',
            description: 'Convert between hundreds of file formats with ease',
            features: ['Multi-Format Support', 'Batch Conversion', 'Live Preview', 'Quality Controls', 'Fast Processing'],
            gradient: 'gradient-section3',
            href: '/universal-converter',
            icon: '🔄'
        }
    ]

    return (
        <main className="min-h-screen p-8 bg-[#0a0a1a] selection:bg-blue-500/30">
            {/* Top Bar */}
            <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12 py-4">
                <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    CONVERT.STUDIO
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-gray-400 text-sm italic">Testing Mode - All Features Unlocked</span>
                    {/* User profile section disabled for testing */}
                </div>
            </nav>

            {/* Header */}
            <header className="text-center mb-16 animate-float">
                <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Professional File Conversion Studio
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    Transform your files with cutting-edge conversion technology. Preview, edit, and export with professional-grade tools.
                </p>
            </header>

            {/* Sections Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sections.map((section) => (
                    section.href.endsWith('.html') ? (
                        <a
                            key={section.id}
                            href={`/3d-4d${section.href}`}
                            className={`section-card section${section.id}-card group block`}
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            {/* Icon */}
                            <div className="text-6xl mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-12">
                                {section.icon}
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                {section.title}
                            </h2>

                            {/* Description */}
                            <p className="text-gray-300 mb-6">
                                {section.description}
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-6">
                                {section.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center text-sm text-gray-400">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${section.gradient}`}></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button className={`btn-primary w-full ${section.gradient} ${hoveredSection === section.id ? 'animate-glow' : ''}`}>
                                Open Studio
                            </button>
                        </a>
                    ) : (
                        <Link
                            key={section.id}
                            href={section.href}
                            className={`section-card section${section.id}-card group`}
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            {/* Icon */}
                            <div className="text-6xl mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-12">
                                {section.icon}
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                {section.title}
                            </h2>

                            {/* Description */}
                            <p className="text-gray-300 mb-6">
                                {section.description}
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-6">
                                {section.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center text-sm text-gray-400">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${section.gradient}`}></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button className={`btn-primary w-full ${section.gradient} ${hoveredSection === section.id ? 'animate-glow' : ''}`}>
                                Open Studio
                            </button>
                        </Link>
                    )
                ))}
            </div>

            {/* Footer */}
            <footer className="text-center mt-24 text-gray-500 border-t border-white/5 pt-8 max-w-7xl mx-auto">
                <p>© 2026 Professional File Conversion Studio - All Rights Reserved</p>
            </footer>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </main>
    )
}
