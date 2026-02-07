'use client'

import { useState } from 'react'

interface SettingsPanelProps {
    onSettingsChange: (settings: Settings3D) => void
}

export interface Settings3D {
    // Mesh Quality
    resolution: number
    detailLevel: 'low' | 'med' | 'high' | 'ultra' | 'extreme'
    depth: number
    baseHeight: number

    // 3D Projection
    projection: 'plane' | 'cylinder' | 'cookie'

    // PROFESSIONAL Quality Enhancement
    smoothness: number
    edgeSharpness: number
    surfaceDetail: number
    noiseReduction: number
    contrastBoost: number
    depthEnhancement: number

    // INDUSTRIAL-GRADE Advanced
    bilateralFilter: number
    laplacianEnhancement: number
    multiScaleProcessing: boolean
    edgePreservation: number
    meshOptimization: boolean

    // CUTTING-EDGE Algorithms
    anisotropicDiffusion: number
    unsharpMasking: number
    gradientEnhancement: number
    adaptiveContrast: boolean

    // Advanced
    invertDepth: boolean
    adaptiveResolution: boolean
    highQualityNormals: boolean

    // Display
    wireframeMode: boolean
    autoRotate: boolean
    lightIntensity: number
    showGrid: boolean
}

export default function SettingsPanel({ onSettingsChange }: SettingsPanelProps) {
    const [settings, setSettings] = useState<Settings3D>({
        resolution: 192,
        detailLevel: 'high',
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

    const updateSetting = <K extends keyof Settings3D>(key: K, value: Settings3D[K]) => {
        const newSettings = { ...settings, [key]: value }

        if (key === 'detailLevel') {
            const detailPresets = {
                low: 64,
                med: 128,
                high: 192,
                ultra: 256,
                extreme: 320
            }
            newSettings.resolution = detailPresets[value as 'low' | 'med' | 'high' | 'ultra' | 'extreme']
        }

        setSettings(newSettings)
        onSettingsChange(newSettings)
    }

    return (
        <div className="space-y-2 text-xs overflow-y-auto max-h-full">
            <h2 className="text-xl font-bold text-white mb-1 sticky top-0 bg-gradient-to-r from-purple-900 to-blue-900 py-2 rounded z-10">🎯 Ultimate Quality</h2>

            {/* Detail Level */}
            <div className="space-y-1 border-b border-white/20 pb-2">
                <h3 className="text-cyan-300 font-bold text-xs">Resolution</h3>
                <div className="grid grid-cols-5 gap-1">
                    {(['low', 'med', 'high', 'ultra', 'extreme'] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() => updateSetting('detailLevel', level)}
                            className={`py-1.5 px-1 rounded font-bold text-[10px] transition-all ${settings.detailLevel === level
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105 shadow-lg'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            {level.toUpperCase()}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-white/60 text-center bg-white/10 py-0.5 rounded">
                    {settings.resolution} vertices
                </p>
            </div>

            {/* Projection */}
            <div className="space-y-1 border-b border-white/20 pb-2">
                <h3 className="text-cyan-300 font-bold text-xs">Projection</h3>
                <div className="grid grid-cols-3 gap-1">
                    {(['plane', 'cylinder', 'cookie'] as const).map((proj) => (
                        <button
                            key={proj}
                            onClick={() => updateSetting('projection', proj)}
                            className={`py-1.5 px-1 rounded font-bold text-[10px] transition-all ${settings.projection === proj
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-105'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            {proj.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* CUTTING-EDGE Algorithms */}
            <div className="space-y-1.5 border-b border-white/20 pb-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-2 rounded">
                <h3 className="text-yellow-300 font-bold text-xs">🚀 Cutting-Edge</h3>

                <Slider
                    label="Anisotropic Diffusion"
                    value={settings.anisotropicDiffusion}
                    onChange={(v: number) => updateSetting('anisotropicDiffusion', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-yellow-500"
                    tooltip="Advanced edge-preserving smoothing"
                />

                <Slider
                    label="Unsharp Masking"
                    value={settings.unsharpMasking}
                    onChange={(v: number) => updateSetting('unsharpMasking', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-orange-500"
                    tooltip="Professional detail enhancement"
                />

                <Slider
                    label="Gradient Enhance"
                    value={settings.gradientEnhancement}
                    onChange={(v: number) => updateSetting('gradientEnhancement', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-red-500"
                    tooltip="Enhances depth gradients"
                />

                <MiniToggle
                    label="Adaptive Contrast"
                    value={settings.adaptiveContrast}
                    onChange={(v: boolean) => updateSetting('adaptiveContrast', v)}
                />
            </div>

            {/* INDUSTRIAL-GRADE Tools */}
            <div className="space-y-1.5 border-b border-white/20 pb-2">
                <h3 className="text-purple-300 font-bold text-xs">⚡ Industrial</h3>

                <Slider
                    label="Bilateral Filter"
                    value={settings.bilateralFilter}
                    onChange={(v: number) => updateSetting('bilateralFilter', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-cyan-500"
                />

                <Slider
                    label="Laplacian Enhance"
                    value={settings.laplacianEnhancement}
                    onChange={(v: number) => updateSetting('laplacianEnhancement', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-purple-500"
                />

                <Slider
                    label="Edge Preservation"
                    value={settings.edgePreservation}
                    onChange={(v: number) => updateSetting('edgePreservation', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-pink-500"
                />

                <div className="grid grid-cols-2 gap-1">
                    <MiniToggle
                        label="Multi-Scale"
                        value={settings.multiScaleProcessing}
                        onChange={(v: boolean) => updateSetting('multiScaleProcessing', v)}
                    />
                    <MiniToggle
                        label="Mesh Opt"
                        value={settings.meshOptimization}
                        onChange={(v: boolean) => updateSetting('meshOptimization', v)}
                    />
                </div>
            </div>

            {/* Quality Enhancement */}
            <div className="space-y-1.5 border-b border-white/20 pb-2">
                <h3 className="text-green-300 font-bold text-xs">✨ Quality</h3>

                <Slider
                    label="Smoothness"
                    value={settings.smoothness}
                    onChange={(v: number) => updateSetting('smoothness', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-blue-500"
                />

                <Slider
                    label="Edge Sharpness"
                    value={settings.edgeSharpness}
                    onChange={(v: number) => updateSetting('edgeSharpness', parseFloat(v.toFixed(1)))}
                    min={0.5}
                    max={3}
                    step={0.1}
                    color="bg-purple-500"
                    decimal
                />

                <Slider
                    label="Surface Detail"
                    value={settings.surfaceDetail}
                    onChange={(v: number) => updateSetting('surfaceDetail', v)}
                    min={1}
                    max={10}
                    step={1}
                    color="bg-green-500"
                />

                <Slider
                    label="Noise Reduction"
                    value={settings.noiseReduction}
                    onChange={(v: number) => updateSetting('noiseReduction', v)}
                    min={0}
                    max={10}
                    step={1}
                    color="bg-orange-500"
                />

                <Slider
                    label="Contrast Boost"
                    value={settings.contrastBoost}
                    onChange={(v: number) => updateSetting('contrastBoost', parseFloat(v.toFixed(1)))}
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    color="bg-pink-500"
                    decimal
                />

                <Slider
                    label="Depth Enhance"
                    value={settings.depthEnhancement}
                    onChange={(v: number) => updateSetting('depthEnhancement', parseFloat(v.toFixed(1)))}
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    color="bg-indigo-500"
                    decimal
                />
            </div>

            {/* Dimensions */}
            <div className="space-y-1.5 border-b border-white/20 pb-2">
                <h3 className="text-cyan-300 font-bold text-xs">📏 Size</h3>

                <Slider
                    label="Depth"
                    value={settings.depth}
                    onChange={(v: number) => updateSetting('depth', v)}
                    min={10}
                    max={200}
                    step={5}
                    color="bg-white/40"
                />

                <Slider
                    label="Base Height"
                    value={settings.baseHeight}
                    onChange={(v: number) => updateSetting('baseHeight', v)}
                    min={0}
                    max={30}
                    step={1}
                    color="bg-white/40"
                />
            </div>

            {/* Advanced */}
            <div className="space-y-1 border-b border-white/20 pb-2">
                <h3 className="text-cyan-300 font-bold text-xs">⚙️ Advanced</h3>
                <div className="grid grid-cols-2 gap-1">
                    <MiniToggle label="HQ Normals" value={settings.highQualityNormals} onChange={(v: boolean) => updateSetting('highQualityNormals', v)} />
                    <MiniToggle label="Adaptive" value={settings.adaptiveResolution} onChange={(v: boolean) => updateSetting('adaptiveResolution', v)} />
                    <MiniToggle label="Invert" value={settings.invertDepth} onChange={(v: boolean) => updateSetting('invertDepth', v)} />
                </div>
            </div>

            {/* Display */}
            <div className="space-y-1 pb-2">
                <h3 className="text-cyan-300 font-bold text-xs">👁️ Display</h3>
                <div className="grid grid-cols-3 gap-1">
                    <MiniToggle label="Wire" value={settings.wireframeMode} onChange={(v: boolean) => updateSetting('wireframeMode', v)} />
                    <MiniToggle label="Rotate" value={settings.autoRotate} onChange={(v: boolean) => updateSetting('autoRotate', v)} />
                    <MiniToggle label="Grid" value={settings.showGrid} onChange={(v: boolean) => updateSetting('showGrid', v)} />
                </div>

                <Slider
                    label="Light"
                    value={settings.lightIntensity}
                    onChange={(v: number) => updateSetting('lightIntensity', parseFloat(v.toFixed(1)))}
                    min={0.2}
                    max={3}
                    step={0.1}
                    color="bg-yellow-500"
                    decimal
                />
            </div>
        </div>
    )
}

function Slider({ label, value, onChange, min, max, step, color, decimal = false, tooltip }: {
    label: string
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    step: number
    color: string
    decimal?: boolean
    tooltip?: string
}) {
    return (
        <div className="space-y-0.5">
            <div className="flex justify-between items-center">
                <label className="text-white text-[10px] font-semibold" title={tooltip}>{label}</label>
                <span className={`text-white text-[10px] ${color} px-1.5 py-0.5 rounded font-bold`}>
                    {decimal ? value.toFixed(1) : value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                title={tooltip || label}
            />
        </div>
    )
}

function MiniToggle({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${value ? 'bg-green-500 text-white' : 'bg-white/20 text-white/70'
                }`}
        >
            {label}
        </button>
    )
}
