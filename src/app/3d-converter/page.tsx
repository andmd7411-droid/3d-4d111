'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Scene3D from '@/components/3d/Scene3D'
import ToolsPanel from '@/components/3d/ToolsPanel'
import SettingsPanel, { Settings3D } from '@/components/3d/SettingsPanel'
import { generateMeshFromImage } from '@/lib/converters/imageToSTL'
import { exportSTL } from '@/lib/converters/stlExporter'

export default function Converter3DPage() {
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [meshData, setMeshData] = useState<any>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [settings, setSettings] = useState<Settings3D>({
        resolution: 128,
        detailLevel: 'med',
        depth: 90,
        baseHeight: 12,
        projection: 'plane',
        smoothness: 6,
        edgeSharpness: 2.0,
        surfaceDetail: 9,
        noiseReduction: 5,
        contrastBoost: 1.5,
        depthEnhancement: 1.6,
        bilateralFilter: 6,
        laplacianEnhancement: 4,
        multiScaleProcessing: true,
        edgePreservation: 8,
        meshOptimization: true,
        anisotropicDiffusion: 5,
        unsharpMasking: 4,
        gradientEnhancement: 6,
        adaptiveContrast: true,
        invertDepth: false,
        adaptiveResolution: true,
        highQualityNormals: true,
        wireframeMode: false,
        autoRotate: false,
        lightIntensity: 1.8,
        showGrid: true
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImageFile(file)
        const reader = new FileReader()
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string
            setImagePreview(dataUrl)

            // Generate 3D mesh from image with current settings
            await regenerateMesh(dataUrl, settings)
        }
        reader.readAsDataURL(file)
    }, [settings])

    const handleSettingsChange = useCallback((newSettings: Settings3D) => {
        setSettings(newSettings)
        // Regenerate mesh if image is loaded
        if (imagePreview && !isProcessing) {
            regenerateMesh(imagePreview, newSettings)
        }
    }, [imagePreview, isProcessing])

    const regenerateMesh = async (dataUrl: string, currentSettings: Settings3D) => {
        setIsProcessing(true)
        setProgress(0)

        try {
            const mesh = await generateMeshFromImage(dataUrl, {
                resolution: currentSettings.resolution,
                depth: currentSettings.depth,
                baseHeight: currentSettings.baseHeight,
                smoothness: currentSettings.smoothness,
                edgeSharpness: currentSettings.edgeSharpness,
                surfaceDetail: currentSettings.surfaceDetail,
                noiseReduction: currentSettings.noiseReduction,
                contrastBoost: currentSettings.contrastBoost,
                depthEnhancement: currentSettings.depthEnhancement,
                bilateralFilter: currentSettings.bilateralFilter,
                laplacianEnhancement: currentSettings.laplacianEnhancement,
                multiScaleProcessing: currentSettings.multiScaleProcessing,
                edgePreservation: currentSettings.edgePreservation,
                meshOptimization: currentSettings.meshOptimization,
                anisotropicDiffusion: currentSettings.anisotropicDiffusion,
                unsharpMasking: currentSettings.unsharpMasking,
                gradientEnhancement: currentSettings.gradientEnhancement,
                adaptiveContrast: currentSettings.adaptiveContrast,
                invertDepth: currentSettings.invertDepth,
                projection: currentSettings.projection,
                adaptiveResolution: currentSettings.adaptiveResolution,
                highQualityNormals: currentSettings.highQualityNormals,
                onProgress: (p) => setProgress(p)
            })
            setMeshData(mesh)
        } catch (error) {
            console.error('Error generating mesh:', error)
            alert('Failed to generate 3D model. Try reducing Resolution to Med or Low.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleExportSTL = useCallback(() => {
        if (!meshData) return

        try {
            console.log('Starting STL export...')
            console.log('Mesh vertices:', meshData.vertices.length)
            console.log('Mesh indices:', meshData.indices.length)
            console.log('Triangles:', meshData.indices.length / 3)

            const stlData = exportSTL(meshData, { binary: true })
            if (stlData instanceof ArrayBuffer) {
                console.log('STL data generated, size:', stlData.byteLength)
            }

            const blob = new Blob([stlData], { type: 'application/octet-stream' })
            console.log('Blob created')

            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `model_${Date.now()}.stl`
            a.click()
            URL.revokeObjectURL(url)

            console.log('Export complete!')
        } catch (error) {
            console.error('Export failed:', error)
            alert('Export failed: ' + error)
        }
    }, [meshData])

    return (
        <div className="min-h-screen gradient-section1 p-8">
            {/* Header */}
            <header className="mb-8">
                <Link href="/" className="text-white hover:underline mb-4 inline-block">
                    ← Back to Home
                </Link>
                <h1 className="text-5xl font-bold text-white mb-2">Image to 3D/4D Converter</h1>
                <p className="text-white/80">Transform your images into superior quality 3D models with professional tools</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
                {/* Upload Section */}
                <div className="lg:col-span-1 card space-y-4">
                    <h2 className="text-2xl font-bold text-white">Upload</h2>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center cursor-pointer hover:border-white/60 transition-all hover:bg-white/5"
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-2" />
                        ) : (
                            <div className="text-white/60">
                                <div className="text-4xl mb-2">📁</div>
                                <p className="text-sm">Click to upload</p>
                                <p className="text-xs mt-1">JPG, PNG, BMP</p>
                            </div>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/bmp"
                        onChange={handleFileSelect}
                        className="hidden"
                        aria-label="Upload image file"
                    />

                    {isProcessing && (
                        <div className="space-y-2">
                            <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-white/80 text-sm text-center">Processing: {progress}%</p>
                        </div>
                    )}

                    {meshData && (
                        <button
                            onClick={handleExportSTL}
                            className="btn-primary w-full bg-white text-purple-900 hover:bg-white/90 font-bold"
                        >
                            💾 Export STL
                        </button>
                    )}
                </div>

                {/* 3D Preview */}
                <div className="lg:col-span-2 card relative">
                    <h2 className="text-2xl font-bold text-white mb-4">3D Preview</h2>
                    <div className="w-full h-[calc(100%-60px)] bg-black/20 rounded-lg overflow-hidden">
                        {meshData ? (
                            <Scene3D
                                meshData={meshData}
                                wireframe={settings.wireframeMode}
                                autoRotate={settings.autoRotate}
                                lightIntensity={settings.lightIntensity}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/40">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">🎨</div>
                                    <p className="text-lg">Upload an image to see the 3D preview</p>
                                    <p className="text-sm mt-2">Adjust settings for superior quality</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Settings Panel */}
                <div className="lg:col-span-1 card overflow-y-auto max-h-[calc(100vh-200px)]">
                    <SettingsPanel onSettingsChange={handleSettingsChange} />
                </div>

                {/* Tools Panel */}
                <div className="lg:col-span-1 card overflow-y-auto max-h-[calc(100vh-200px)]">
                    <ToolsPanel meshData={meshData} onMeshUpdate={setMeshData} />
                </div>
            </div>
        </div>
    )
}
