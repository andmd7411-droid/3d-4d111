'use client'

import { useState, useCallback } from 'react'

interface ToolsPanelProps {
    meshData: any
    onMeshUpdate: (newMeshData: any) => void
}

export default function ToolsPanel({ meshData, onMeshUpdate }: ToolsPanelProps) {
    const [isProcessing, setIsProcessing] = useState(false)

    const applyTransform = useCallback((type: string) => {
        if (!meshData || isProcessing) return

        setIsProcessing(true)

        setTimeout(() => {
            try {
                const vertices = new Float32Array(meshData.vertices)
                const indices = new Uint32Array(meshData.indices)

                switch (type) {
                    case 'rotateX':
                        rotateVertices(vertices, Math.PI / 6, 'x')
                        break
                    case 'rotateY':
                        rotateVertices(vertices, Math.PI / 6, 'y')
                        break
                    case 'rotateZ':
                        rotateVertices(vertices, Math.PI / 6, 'z')
                        break
                    case 'scaleUp':
                        scaleVertices(vertices, 1.15)
                        break
                    case 'scaleDown':
                        scaleVertices(vertices, 0.85)
                        break
                    case 'extrudeUp':
                        extrudeVertices(vertices, 1.25)
                        break
                    case 'extrudeDown':
                        extrudeVertices(vertices, 0.75)
                        break
                }

                // Recompute normals
                const normals = computeNormals(vertices, indices)

                onMeshUpdate({
                    vertices,
                    indices,
                    normals
                })
            } catch (error) {
                console.error('Transform error:', error)
            } finally {
                setIsProcessing(false)
            }
        }, 50)
    }, [meshData, onMeshUpdate, isProcessing])

    const tools = [
        { id: 'rotateX', label: 'Rotate X', icon: '🔄', color: 'bg-blue-500', category: 'transform' },
        { id: 'rotateY', label: 'Rotate Y', icon: '🔄', color: 'bg-blue-600', category: 'transform' },
        { id: 'rotateZ', label: 'Rotate Z', icon: '🔄', color: 'bg-blue-700', category: 'transform' },
        { id: 'scaleUp', label: 'Scale +', icon: '➕', color: 'bg-green-500', category: 'scale' },
        { id: 'scaleDown', label: 'Scale -', icon: '➖', color: 'bg-green-600', category: 'scale' },
        { id: 'extrudeUp', label: 'Extrude +', icon: '⬆️', color: 'bg-purple-500', category: 'extrude' },
        { id: 'extrudeDown', label: 'Extrude -', icon: '⬇️', color: 'bg-purple-600', category: 'extrude' },
    ]

    return (
        <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Transform Tools</h2>

            {!meshData && (
                <p className="text-white/60 text-xs bg-white/10 p-2 rounded">Upload image first</p>
            )}

            <div className="space-y-2">
                {/* Transform */}
                <div className="space-y-1">
                    <h3 className="text-cyan-300 text-xs font-bold">🔄 Rotate</h3>
                    <div className="grid grid-cols-3 gap-1">
                        {tools.filter(t => t.category === 'transform').map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => applyTransform(tool.id)}
                                disabled={!meshData || isProcessing}
                                className={`${tool.color} hover:opacity-90 text-white font-bold py-2 px-2 rounded text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg`}
                                title={tool.label}
                            >
                                {tool.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scale */}
                <div className="space-y-1">
                    <h3 className="text-green-300 text-xs font-bold">📏 Scale</h3>
                    <div className="grid grid-cols-2 gap-1">
                        {tools.filter(t => t.category === 'scale').map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => applyTransform(tool.id)}
                                disabled={!meshData || isProcessing}
                                className={`${tool.color} hover:opacity-90 text-white font-bold py-2 px-2 rounded text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg`}
                                title={tool.label}
                            >
                                {tool.icon} {tool.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Extrude */}
                <div className="space-y-1">
                    <h3 className="text-purple-300 text-xs font-bold">⬆️ Extrude</h3>
                    <div className="grid grid-cols-2 gap-1">
                        {tools.filter(t => t.category === 'extrude').map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => applyTransform(tool.id)}
                                disabled={!meshData || isProcessing}
                                className={`${tool.color} hover:opacity-90 text-white font-bold py-2 px-2 rounded text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg`}
                                title={tool.label}
                            >
                                {tool.icon} {tool.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isProcessing && (
                <div className="text-center text-white/80 text-xs animate-pulse bg-gradient-to-r from-blue-500 to-purple-500 py-2 rounded font-bold">
                    Processing...
                </div>
            )}

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-2 rounded text-xs text-white/80 border border-white/20">
                <p className="font-semibold mb-1">💡 Pro Tips:</p>
                <ul className="text-[10px] space-y-0.5 ml-3">
                    <li>• Use Settings panel for quality controls</li>
                    <li>• All quality tools are in Settings</li>
                    <li>• These tools are safe and fast</li>
                </ul>
            </div>
        </div>
    )
}

// Helper functions
function rotateVertices(vertices: Float32Array, angle: number, axis: 'x' | 'y' | 'z') {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i]
        const y = vertices[i + 1]
        const z = vertices[i + 2]

        if (axis === 'x') {
            vertices[i + 1] = y * cos - z * sin
            vertices[i + 2] = y * sin + z * cos
        } else if (axis === 'y') {
            vertices[i] = x * cos + z * sin
            vertices[i + 2] = -x * sin + z * cos
        } else if (axis === 'z') {
            vertices[i] = x * cos - y * sin
            vertices[i + 1] = x * sin + y * cos
        }
    }
}

function scaleVertices(vertices: Float32Array, factor: number) {
    for (let i = 0; i < vertices.length; i++) {
        vertices[i] *= factor
    }
}

function extrudeVertices(vertices: Float32Array, factor: number) {
    for (let i = 1; i < vertices.length; i += 3) {
        vertices[i] *= factor
    }
}

function computeNormals(vertices: Float32Array, indices: Uint32Array): Float32Array {
    const normals = new Float32Array(vertices.length)

    for (let i = 0; i < normals.length; i++) {
        normals[i] = 0
    }

    for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i] * 3
        const i2 = indices[i + 1] * 3
        const i3 = indices[i + 2] * 3

        const v1x = vertices[i1], v1y = vertices[i1 + 1], v1z = vertices[i1 + 2]
        const v2x = vertices[i2], v2y = vertices[i2 + 1], v2z = vertices[i2 + 2]
        const v3x = vertices[i3], v3y = vertices[i3 + 1], v3z = vertices[i3 + 2]

        const e1x = v2x - v1x, e1y = v2y - v1y, e1z = v2z - v1z
        const e2x = v3x - v1x, e2y = v3y - v1y, e2z = v3z - v1z

        const nx = e1y * e2z - e1z * e2y
        const ny = e1z * e2x - e1x * e2z
        const nz = e1x * e2y - e1y * e2x

        normals[i1] += nx; normals[i1 + 1] += ny; normals[i1 + 2] += nz
        normals[i2] += nx; normals[i2 + 1] += ny; normals[i2 + 2] += nz
        normals[i3] += nx; normals[i3 + 1] += ny; normals[i3 + 2] += nz
    }

    for (let i = 0; i < normals.length; i += 3) {
        const length = Math.sqrt(
            normals[i] * normals[i] +
            normals[i + 1] * normals[i + 1] +
            normals[i + 2] * normals[i + 2]
        )
        if (length > 0) {
            normals[i] /= length
            normals[i + 1] /= length
            normals[i + 2] /= length
        }
    }

    return normals
}
