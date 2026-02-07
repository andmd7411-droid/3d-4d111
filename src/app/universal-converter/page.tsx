'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ImageConverter, ImageFormat, ImageConversionOptions } from '@/lib/converter/ImageConverter'
import { DocumentConverter, DocumentFormat, DocumentConversionOptions } from '@/lib/converter/DocumentConverter'
import { ModelConverter, ModelFormat, ModelConversionOptions } from '@/lib/converter/ModelConverter'
import { MediaConverter, MediaFormat, MediaConversionOptions } from '@/lib/converter/MediaConverter'
import { ArchiveConverter, ArchiveFormat, ArchiveConversionOptions } from '@/lib/converter/ArchiveConverter'

interface ConversionOption {
    from: string
    to: string[]
    category: string
    icon: string
}

const conversionOptions: ConversionOption[] = [
    {
        category: 'Images',
        icon: '🖼️',
        from: 'Image',
        to: ['JPG', 'PNG', 'WEBP', 'BMP', 'ICO']
    },
    {
        category: 'Documents',
        icon: '📄',
        from: 'Document',
        to: ['PDF', 'TXT', 'MD', 'HTML']
    },
    {
        category: '3D Models',
        icon: '🎨',
        from: '3D',
        to: ['STL', 'OBJ', 'GLTF', 'PLY', 'GLB']
    },
    {
        category: 'Audio',
        icon: '🎵',
        from: 'Audio',
        to: ['MP3', 'WAV', 'OGG', 'AAC']
    },
    {
        category: 'Video',
        icon: '🎬',
        from: 'Video',
        to: ['MP4', 'WEBM', 'GIF', 'AVI', 'MOV']
    },
    {
        category: 'Archives',
        icon: '📦',
        from: 'Archive',
        to: ['ZIP']
    }
]

export default function UniversalConverterPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [targetFormat, setTargetFormat] = useState<string>('')
    const [isConverting, setIsConverting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null)
    const [conversionTime, setConversionTime] = useState<number>(0)
    const [statusMessage, setStatusMessage] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Image Settings
    const [quality, setQuality] = useState<number>(0.9)
    const [resizeWidth, setResizeWidth] = useState<number | ''>('')
    const [resizeHeight, setResizeHeight] = useState<number | ''>('')
    const [maintainAspect, setMaintainAspect] = useState(true)

    // Document Settings
    const [fontSize, setFontSize] = useState<number>(12)
    const [margin, setMargin] = useState<number>(10)

    // 3D Settings
    const [isBinary, setIsBinary] = useState<boolean>(true)

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSelectedFile(file)
        setConvertedBlob(null)
        setProgress(0)
        setStatusMessage('')

        // Reset settings
        setQuality(0.9)
        setResizeWidth('')
        setResizeHeight('')
        setFontSize(12)
        setMargin(10)
        setIsBinary(true)

        // Auto-detect category
        const ext = file.name.split('.').pop()?.toUpperCase() || ''
        const category = conversionOptions.find(opt => opt.to.includes(ext) || (opt.category === 'Images' && ['JPG', 'JPEG', 'PNG', 'WEBP', 'BMP', 'GIF'].includes(ext)))

        if (category) {
            setSelectedCategory(category.category)
        } else if (['JPG', 'JPEG', 'PNG', 'WEBP', 'BMP', 'GIF', 'TIFF', 'AVIF'].includes(ext)) {
            setSelectedCategory('Images')
        } else if (['TXT', 'MD', 'HTML', 'JS', 'TS', 'CSS', 'JSON', 'XML', 'CSV'].includes(ext)) {
            setSelectedCategory('Documents')
        } else if (['STL', 'OBJ', 'GLTF', 'GLB', 'PLY', '3DS', 'FBX'].includes(ext)) {
            setSelectedCategory('3D Models')
        }
    }, [])

    const handleConvert = useCallback(async () => {
        if (!selectedFile || !targetFormat) return

        setIsConverting(true)
        setProgress(10)
        setConvertedBlob(null)
        const startTime = performance.now()

        try {
            if (selectedCategory === 'Images') {
                const options: ImageConversionOptions = {
                    format: targetFormat as ImageFormat,
                    quality: quality,
                    width: resizeWidth ? Number(resizeWidth) : undefined,
                    height: resizeHeight ? Number(resizeHeight) : undefined,
                    maintainAspectRatio: maintainAspect
                }

                setProgress(40)
                await new Promise(r => setTimeout(r, 50)) // UI Update

                const blob = await ImageConverter.convert(selectedFile, options)
                setConvertedBlob(blob)

            } else if (selectedCategory === 'Documents') {
                const options: DocumentConversionOptions = {
                    format: targetFormat as DocumentFormat,
                    fontSize: fontSize,
                    margin: margin
                }
                setProgress(40)
                await new Promise(r => setTimeout(r, 50))
                const blob = await DocumentConverter.convert(selectedFile, options)
                setConvertedBlob(blob)

            } else if (selectedCategory === 'Audio' || selectedCategory === 'Video') {
                const options: MediaConversionOptions = {
                    format: targetFormat as MediaFormat,
                    onProgress: (p) => {
                        setProgress(p)
                        setStatusMessage(`Encoding... ${Math.round(p)}%`)
                    }
                }
                setStatusMessage('Loading FFmpeg core (first time may take longer)...')

                try {
                    const blob = await MediaConverter.convert(selectedFile, options)
                    setConvertedBlob(blob)
                } catch (e: any) {
                    console.error("Conversion failed:", e);
                    // Check for common errors
                    if (e.message.includes('SharedArrayBuffer')) {
                        throw new Error("Browser security headers missing. Please restart the dev server or check next.config.mjs.");
                    } else if (e.message.includes('FFmpeg Load Error')) {
                        throw new Error(e.message);
                    }
                    throw e;
                }
            } else if (selectedCategory === '3D Models') {
                const options: ModelConversionOptions = {
                    format: targetFormat as ModelFormat,
                    binary: isBinary
                }
                setProgress(30)
                await new Promise(r => setTimeout(r, 100))
                const blob = await ModelConverter.convert(selectedFile, options)
                setConvertedBlob(blob)
            }

            setProgress(100)
        } catch (error) {
            console.error(error)
            alert('Conversion failed: ' + error)
        } finally {
            const endTime = performance.now()
            setConversionTime(Math.round(endTime - startTime))
            setIsConverting(false)
        }
    }, [selectedFile, targetFormat, selectedCategory, quality, resizeWidth, resizeHeight, maintainAspect, fontSize, margin, isBinary])

    const handleDownload = useCallback(() => {
        if (!convertedBlob && !selectedFile) return

        const blobToDownload = convertedBlob || selectedFile
        if (!blobToDownload) return;

        const url = URL.createObjectURL(blobToDownload)
        const a = document.createElement('a')
        a.href = url

        const originalName = selectedFile?.name || 'converted'
        const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
        const ext = targetFormat.toLowerCase() || 'converted'

        a.download = `${baseName}_converted.${ext}`
        a.click()
        URL.revokeObjectURL(url)
    }, [convertedBlob, selectedFile, targetFormat])

    // Preview Original Image dimensions
    useEffect(() => {
        if (selectedFile && selectedCategory === 'Images') {
            const img = new Image()
            img.onload = () => {
                setResizeWidth(img.width)
                setResizeHeight(img.height)
            }
            img.src = URL.createObjectURL(selectedFile)
        }
    }, [selectedFile, selectedCategory])

    const currentOptions = conversionOptions.find(opt => opt.category === selectedCategory)

    return (
        <div className="min-h-screen gradient-section3 p-8">
            {/* Header */}
            <header className="mb-8">
                <Link href="/" className="text-white hover:underline mb-4 inline-block">
                    ← Back to Home
                </Link>
                <h1 className="text-5xl font-bold text-white mb-2">Universal File Converter</h1>
                <p className="text-white/80">Convert between formats with professional quality control</p>
            </header>

            <div className="max-w-6xl mx-auto">
                {/* Category Selection */}
                <div className="card mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Select Category</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {conversionOptions.map((option) => (
                            <button
                                key={option.category}
                                onClick={() => {
                                    setSelectedCategory(option.category)
                                    setTargetFormat('')
                                    setConvertedBlob(null)
                                }}
                                className={`card text-center transition-all ${selectedCategory === option.category
                                    ? 'bg-white/20 scale-105 border-white/50'
                                    : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="text-4xl mb-2">{option.icon}</div>
                                <div className="text-white text-sm font-semibold">{option.category}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Upload */}
                    <div className="card space-y-6 lg:col-span-1">
                        <h2 className="text-2xl font-bold text-white">1. Upload File</h2>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-white/60 transition-all hover:bg-white/5"
                        >
                            {selectedFile ? (
                                <div className="text-white">
                                    <div className="text-5xl mb-4">
                                        {selectedCategory === 'Images' ? '🖼️' : selectedCategory === 'Documents' ? '📄' : '🎨'}
                                    </div>
                                    <p className="font-semibold break-all">{selectedFile.name}</p>
                                    <p className="text-sm text-white/60 mt-2">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            ) : (
                                <div className="text-white/60">
                                    <div className="text-6xl mb-4">⬆️</div>
                                    <p className="text-lg">Click to Upload</p>
                                </div>
                            )}
                        </div>

                        <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />

                        {selectedFile && (
                            <button
                                onClick={() => {
                                    setSelectedFile(null)
                                    setTargetFormat('')
                                    setConvertedBlob(null)
                                }}
                                className="btn-primary w-full bg-red-500/20 hover:bg-red-500/40 text-white"
                            >
                                🗑️ Clear File
                            </button>
                        )}
                    </div>

                    {/* Middle Column: Controls */}
                    <div className="card space-y-6 lg:col-span-1">
                        <h2 className="text-2xl font-bold text-white">2. Settings</h2>

                        {currentOptions ? (
                            <div className="space-y-4">
                                <label className="block text-white mb-2 font-semibold">Target Format</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {currentOptions.to.map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => setTargetFormat(format)}
                                            className={`px-3 py-2 rounded text-sm font-bold transition-colors ${targetFormat === format
                                                ? 'bg-white text-purple-900'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}
                                        >
                                            {format}
                                        </button>
                                    ))}
                                </div>

                                {/* Image Specific Settings */}
                                {selectedCategory === 'Images' && (
                                    <div className="pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
                                        <div>
                                            <label className="flex justify-between text-white text-sm mb-1">
                                                <span>Quality</span>
                                                <span>{Math.round(quality * 100)}%</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={quality}
                                                onChange={(e) => setQuality(parseFloat(e.target.value))}
                                                className="w-full accent-white"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-white text-sm">Resize (px)</label>
                                                <label className="flex items-center space-x-2 text-xs text-white/70">
                                                    <input
                                                        type="checkbox"
                                                        checked={maintainAspect}
                                                        onChange={(e) => setMaintainAspect(e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <span>Lock Aspect Ratio</span>
                                                </label>
                                            </div>
                                            <div className="flex space-x-2">
                                                <input
                                                    type="number"
                                                    placeholder="W"
                                                    value={resizeWidth}
                                                    onChange={(e) => setResizeWidth(Number(e.target.value))}
                                                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                                                />
                                                <span className="text-white self-center">x</span>
                                                <input
                                                    type="number"
                                                    placeholder="H"
                                                    value={resizeHeight}
                                                    onChange={(e) => setResizeHeight(Number(e.target.value))}
                                                    className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Document Specific Settings */}
                                {selectedCategory === 'Documents' && (
                                    <div className="pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
                                        <div className="space-y-2">
                                            <label className="text-white text-sm">Font Size (pt)</label>
                                            <input
                                                type="number"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(Number(e.target.value))}
                                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-white text-sm">Margin (mm)</label>
                                            <input
                                                type="number"
                                                value={margin}
                                                onChange={(e) => setMargin(Number(e.target.value))}
                                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 3D Model Specific Settings */}
                                {selectedCategory === '3D Models' && (
                                    <div className="pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={isBinary}
                                                onChange={(e) => setIsBinary(e.target.checked)}
                                                className="rounded"
                                            />
                                            <label className="text-white text-sm">Binary Export (Smaller Size)</label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-white/40 text-center py-8">Select a category and file first</div>
                        )}
                    </div>

                    {/* Right Column: Action & Result */}
                    <div className="card space-y-6 lg:col-span-1 bg-white/5 border border-white/10">
                        <h2 className="text-2xl font-bold text-white">3. Convert</h2>

                        <div className="flex flex-col h-full justify-between">
                            <div className="space-y-4">
                                {isConverting && (
                                    <div className="space-y-2">
                                        <div className="w-full bg-white/10 rounded-full h-2">
                                            <div
                                                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-white text-center text-sm">Processing... {progress}%</p>
                                    </div>
                                )}

                                {!convertedBlob && (
                                    <button
                                        onClick={handleConvert}
                                        disabled={!selectedFile || !targetFormat || isConverting}
                                        className="btn-primary w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
                                    >
                                        {isConverting ? '⏳ Working...' : '⚡ Convert Now'}
                                    </button>
                                )}

                                {convertedBlob && (
                                    <div className="animate-scaleIn bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                                        <div className="text-4xl mb-2">✅</div>
                                        <h3 className="text-white font-bold text-lg mb-1">Conversion Complete!</h3>
                                        <p className="text-white/70 text-sm mb-4">
                                            Time: {conversionTime}ms • Size: {(convertedBlob.size / 1024).toFixed(2)} KB
                                        </p>
                                        <button
                                            onClick={handleDownload}
                                            className="btn-primary w-full bg-green-500 hover:bg-green-600 text-white shadow-lg animate-pulse"
                                        >
                                            💾 Download {targetFormat}
                                        </button>
                                        <button
                                            onClick={() => setConvertedBlob(null)}
                                            className="text-white/50 text-xs mt-3 hover:text-white underline"
                                        >
                                            Convert Another
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
