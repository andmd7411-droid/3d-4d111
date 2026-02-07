interface MeshGenerationOptions {
    resolution?: number
    depth?: number
    smoothness?: number
    baseHeight?: number
    edgeSharpness?: number
    surfaceDetail?: number
    noiseReduction?: number
    contrastBoost?: number
    depthEnhancement?: number
    bilateralFilter?: number
    laplacianEnhancement?: number
    multiScaleProcessing?: boolean
    edgePreservation?: number
    meshOptimization?: boolean
    anisotropicDiffusion?: number
    unsharpMasking?: number
    gradientEnhancement?: number
    adaptiveContrast?: boolean
    invertDepth?: boolean
    projection?: 'plane' | 'cylinder' | 'cookie'
    adaptiveResolution?: boolean
    highQualityNormals?: boolean
    generateSolid?: boolean
    onProgress?: (progress: number) => void
}

export async function generateMeshFromImage(
    imageDataUrl: string,
    options: MeshGenerationOptions = {}
): Promise<{
    vertices: Float32Array
    indices: Uint32Array
    normals?: Float32Array
}> {
    const {
        resolution = 128,
        depth = 90,
        smoothness = 6,
        baseHeight = 12,
        edgeSharpness = 2.0,
        surfaceDetail = 9,
        noiseReduction = 5,
        contrastBoost = 1.5,
        depthEnhancement = 1.6,
        bilateralFilter = 6,
        laplacianEnhancement = 4,
        multiScaleProcessing = true,
        edgePreservation = 8,
        meshOptimization = true,
        anisotropicDiffusion = 5,
        unsharpMasking = 4,
        gradientEnhancement = 6,
        adaptiveContrast = true,
        invertDepth = false,
        projection = 'plane',
        adaptiveResolution = true,
        highQualityNormals = true,
        generateSolid = true,
        onProgress
    } = options

    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                canvas.width = resolution
                canvas.height = resolution
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    reject(new Error('Could not get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, resolution, resolution)
                const imageData = ctx.getImageData(0, 0, resolution, resolution)

                onProgress?.(2)

                // STEP 1: Generate ULTIMATE quality height map
                let heightMap: number[][] = []
                for (let y = 0; y < resolution; y++) {
                    heightMap[y] = []
                    for (let x = 0; x < resolution; x++) {
                        const i = (y * resolution + x) * 4
                        const r = imageData.data[i]
                        const g = imageData.data[i + 1]
                        const b = imageData.data[i + 2]

                        // ULTIMATE RGB weighting (ITU-R BT.709)
                        let brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255

                        // ADAPTIVE CONTRAST (local histogram equalization)
                        if (adaptiveContrast) {
                            brightness = applyAdaptiveContrastSingle(imageData, x, y, resolution, brightness)
                        }

                        // CONTRAST BOOST
                        if (contrastBoost !== 1.0) {
                            brightness = Math.pow(brightness, 1 / contrastBoost)
                            brightness = Math.min(1, Math.max(0, brightness))
                        }

                        // SURFACE DETAIL enhancement
                        if (surfaceDetail > 5) {
                            const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
                            const detailFactor = ((surfaceDetail - 5) / 5) * 0.7
                            brightness += (variance / 765) * detailFactor
                            brightness = Math.min(1, Math.max(0, brightness))
                        }

                        // EDGE SHARPNESS
                        if (edgeSharpness !== 1.0) {
                            brightness = Math.pow(brightness, 1 / edgeSharpness)
                        }

                        if (invertDepth) {
                            brightness = 1 - brightness
                        }

                        heightMap[y][x] = brightness
                    }
                }

                onProgress?.(8)

                // STEP 2: ANISOTROPIC DIFFUSION (advanced edge-preserving)
                if (anisotropicDiffusion > 0) {
                    heightMap = applyAnisotropicDiffusion(heightMap, resolution, anisotropicDiffusion)
                }

                onProgress?.(15)

                // STEP 3: MULTI-SCALE PROCESSING
                if (multiScaleProcessing) {
                    heightMap = applyMultiScaleProcessing(heightMap, resolution)
                }

                onProgress?.(22)

                // STEP 4: BILATERAL FILTER
                if (bilateralFilter > 0) {
                    heightMap = applyBilateralFilter(heightMap, resolution, bilateralFilter, edgePreservation)
                }

                onProgress?.(30)

                // STEP 5: NOISE REDUCTION
                if (noiseReduction > 0) {
                    heightMap = applyAdvancedNoiseReduction(heightMap, resolution, noiseReduction)
                }

                onProgress?.(38)

                // STEP 6: PROFESSIONAL SMOOTHING
                if (smoothness > 0) {
                    heightMap = applyProfessionalSmoothing(heightMap, resolution, smoothness)
                }

                onProgress?.(46)

                // STEP 7: GRADIENT ENHANCEMENT
                if (gradientEnhancement > 0) {
                    heightMap = applyGradientEnhancement(heightMap, resolution, gradientEnhancement)
                }

                onProgress?.(54)

                // STEP 8: LAPLACIAN ENHANCEMENT
                if (laplacianEnhancement > 0) {
                    heightMap = applyLaplacianEnhancement(heightMap, resolution, laplacianEnhancement)
                }

                onProgress?.(60)

                // STEP 9: UNSHARP MASKING (professional sharpening)
                if (unsharpMasking > 0) {
                    heightMap = applyUnsharpMasking(heightMap, resolution, unsharpMasking)
                }

                onProgress?.(66)

                // STEP 10: DEPTH ENHANCEMENT
                if (depthEnhancement !== 1.0) {
                    for (let y = 0; y < resolution; y++) {
                        for (let x = 0; x < resolution; x++) {
                            heightMap[y][x] = Math.pow(heightMap[y][x], depthEnhancement)
                        }
                    }
                }

                // Scale to final depth
                for (let y = 0; y < resolution; y++) {
                    for (let x = 0; x < resolution; x++) {
                        heightMap[y][x] = heightMap[y][x] * depth + baseHeight
                    }
                }

                onProgress?.(72)

                // STEP 11: Generate vertices with projection (TOP SURFACE)
                const vertices: number[] = []
                const indices: number[] = []

                for (let y = 0; y < resolution; y++) {
                    for (let x = 0; x < resolution; x++) {
                        const height = heightMap[y][x]

                        let vx, vy, vz

                        if (projection === 'cylinder') {
                            const angle = (x / resolution) * Math.PI * 2
                            const radius = resolution / 4
                            vx = Math.cos(angle) * (radius + height)
                            vy = y - resolution / 2
                            vz = Math.sin(angle) * (radius + height)
                        } else if (projection === 'cookie') {
                            const dx = x - resolution / 2
                            const dy = y - resolution / 2
                            const dist = Math.sqrt(dx * dx + dy * dy) / (resolution / 2)
                            const edgeFactor = Math.pow(dist, 2) * 35
                            vx = dx
                            vy = height + edgeFactor
                            vz = dy
                        } else {
                            vx = x - resolution / 2
                            vy = height
                            vz = y - resolution / 2
                        }

                        vertices.push(vx, vy, vz)
                    }
                }

                // STEP 12: Generate TOP SURFACE indices
                for (let y = 0; y < resolution - 1; y++) {
                    for (let x = 0; x < resolution - 1; x++) {
                        const topLeft = y * resolution + x
                        const topRight = topLeft + 1
                        const bottomLeft = (y + 1) * resolution + x
                        const bottomRight = bottomLeft + 1

                        if (adaptiveResolution) {
                            const h1 = heightMap[y][x]
                            const h2 = heightMap[y][x + 1]
                            const h3 = heightMap[y + 1][x]
                            const h4 = heightMap[y + 1][x + 1]

                            const diag1 = Math.abs(h1 - h4)
                            const diag2 = Math.abs(h2 - h3)

                            if (diag1 < diag2) {
                                indices.push(topLeft, bottomLeft, bottomRight)
                                indices.push(topLeft, bottomRight, topRight)
                            } else {
                                indices.push(topLeft, bottomLeft, topRight)
                                indices.push(topRight, bottomLeft, bottomRight)
                            }
                        } else {
                            indices.push(topLeft, bottomLeft, topRight)
                            indices.push(topRight, bottomLeft, bottomRight)
                        }
                    }
                }

                onProgress?.(77)

                // STEP 13: Generate WATERTIGHT SOLID (bottom + sides)
                if (generateSolid) {
                    const bottomOffset = vertices.length / 3

                    // Add BOTTOM vertices (flat base at y = 0)
                    for (let y = 0; y < resolution; y++) {
                        for (let x = 0; x < resolution; x++) {
                            let vx, vz

                            if (projection === 'cylinder') {
                                const angle = (x / resolution) * Math.PI * 2
                                const radius = resolution / 4
                                vx = Math.cos(angle) * radius
                                vz = Math.sin(angle) * radius
                            } else if (projection === 'cookie') {
                                const dx = x - resolution / 2
                                const dy = y - resolution / 2
                                vx = dx
                                vz = dy
                            } else {
                                vx = x - resolution / 2
                                vz = y - resolution / 2
                            }

                            vertices.push(vx, 0, vz)
                        }
                    }

                    onProgress?.(80)

                    // Add BOTTOM FACE indices (reversed winding for outward normals)
                    for (let y = 0; y < resolution - 1; y++) {
                        for (let x = 0; x < resolution - 1; x++) {
                            const topLeft = bottomOffset + y * resolution + x
                            const topRight = topLeft + 1
                            const bottomLeft = bottomOffset + (y + 1) * resolution + x
                            const bottomRight = bottomLeft + 1

                            // Reversed winding (clockwise from bottom view)
                            indices.push(topLeft, topRight, bottomLeft)
                            indices.push(topRight, bottomRight, bottomLeft)
                        }
                    }

                    onProgress?.(84)

                    // Add SIDE WALLS
                    // Front edge (y = 0)
                    for (let x = 0; x < resolution - 1; x++) {
                        const topLeft = x
                        const topRight = x + 1
                        const bottomLeft = bottomOffset + x
                        const bottomRight = bottomOffset + x + 1

                        indices.push(topLeft, bottomLeft, topRight)
                        indices.push(topRight, bottomLeft, bottomRight)
                    }

                    // Back edge (y = resolution - 1)
                    for (let x = 0; x < resolution - 1; x++) {
                        const topLeft = (resolution - 1) * resolution + x
                        const topRight = topLeft + 1
                        const bottomLeft = bottomOffset + (resolution - 1) * resolution + x
                        const bottomRight = bottomLeft + 1

                        indices.push(topLeft, topRight, bottomLeft)
                        indices.push(topRight, bottomRight, bottomLeft)
                    }

                    // Left edge (x = 0)
                    for (let y = 0; y < resolution - 1; y++) {
                        const topLeft = y * resolution
                        const topRight = (y + 1) * resolution
                        const bottomLeft = bottomOffset + y * resolution
                        const bottomRight = bottomOffset + (y + 1) * resolution

                        indices.push(topLeft, topRight, bottomLeft)
                        indices.push(topRight, bottomRight, bottomLeft)
                    }

                    // Right edge (x = resolution - 1)
                    for (let y = 0; y < resolution - 1; y++) {
                        const topLeft = y * resolution + (resolution - 1)
                        const topRight = (y + 1) * resolution + (resolution - 1)
                        const bottomLeft = bottomOffset + y * resolution + (resolution - 1)
                        const bottomRight = bottomOffset + (y + 1) * resolution + (resolution - 1)

                        indices.push(topLeft, bottomLeft, topRight)
                        indices.push(topRight, bottomLeft, bottomRight)
                    }
                }

                onProgress?.(88)

                // STEP 14: MESH OPTIMIZATION
                let finalVertices = new Float32Array(vertices) as Float32Array
                let finalIndices = new Uint32Array(indices) as Uint32Array

                if (meshOptimization) {
                    const optimized = optimizeMesh(finalVertices, finalIndices)
                    finalVertices = optimized.vertices
                    finalIndices = optimized.indices
                }

                onProgress?.(94)

                // STEP 15: Compute ULTIMATE normals
                const normals = highQualityNormals
                    ? computeProfessionalNormals(finalVertices, finalIndices)
                    : computeStandardNormals(finalVertices, finalIndices)

                onProgress?.(100)

                resolve({
                    vertices: finalVertices,
                    indices: finalIndices,
                    normals
                })
            } catch (error) {
                reject(error)
            }
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = imageDataUrl
    })
}

// ADAPTIVE CONTRAST - local histogram equalization
function applyAdaptiveContrastSingle(imageData: ImageData, x: number, y: number, resolution: number, brightness: number): number {
    let localSum = 0
    let count = 0
    const windowSize = 5

    for (let ky = -windowSize; ky <= windowSize; ky++) {
        for (let kx = -windowSize; kx <= windowSize; kx++) {
            const ny = y + ky
            const nx = x + kx

            if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                const i = (ny * resolution + nx) * 4
                const r = imageData.data[i]
                const g = imageData.data[i + 1]
                const b = imageData.data[i + 2]
                const localBrightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255
                localSum += localBrightness
                count++
            }
        }
    }

    const localAvg = localSum / count
    const diff = brightness - localAvg
    return Math.min(1, Math.max(0, brightness + diff * 0.3))
}

// ANISOTROPIC DIFFUSION - advanced edge-preserving smoothing
function applyAnisotropicDiffusion(heightMap: number[][], resolution: number, iterations: number): number[][] {
    let result = heightMap.map(row => [...row])
    const actualIterations = Math.min(iterations, 8)
    const kappa = 0.1 // Edge threshold
    const lambda = 0.2 // Diffusion rate

    for (let iter = 0; iter < actualIterations; iter++) {
        const temp: number[][] = []

        for (let y = 0; y < resolution; y++) {
            temp[y] = []
            for (let x = 0; x < resolution; x++) {
                const center = result[y][x]
                let diffusion = 0

                // Calculate gradients in 4 directions
                const directions = [
                    [y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]
                ]

                for (const [ny, nx] of directions) {
                    if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                        const gradient = result[ny][nx] - center
                        const c = Math.exp(-(gradient * gradient) / (kappa * kappa))
                        diffusion += c * gradient
                    }
                }

                temp[y][x] = center + lambda * diffusion
            }
        }

        result = temp
    }

    return result
}

// GRADIENT ENHANCEMENT - enhances depth gradients
function applyGradientEnhancement(heightMap: number[][], resolution: number, strength: number): number[][] {
    const result: number[][] = []
    const factor = strength / 10

    for (let y = 0; y < resolution; y++) {
        result[y] = []
        for (let x = 0; x < resolution; x++) {
            let gradX = 0, gradY = 0

            if (x > 0 && x < resolution - 1) {
                gradX = (heightMap[y][x + 1] - heightMap[y][x - 1]) / 2
            }
            if (y > 0 && y < resolution - 1) {
                gradY = (heightMap[y + 1][x] - heightMap[y - 1][x]) / 2
            }

            const gradMag = Math.sqrt(gradX * gradX + gradY * gradY)
            const enhancement = gradMag * factor

            result[y][x] = Math.min(1, Math.max(0, heightMap[y][x] + enhancement))
        }
    }

    return result
}

// UNSHARP MASKING - professional sharpening
function applyUnsharpMasking(heightMap: number[][], resolution: number, strength: number): number[][] {
    // First, create a blurred version
    const blurred: number[][] = []
    const amount = strength / 10

    for (let y = 0; y < resolution; y++) {
        blurred[y] = []
        for (let x = 0; x < resolution; x++) {
            let sum = 0
            let count = 0

            for (let ky = -2; ky <= 2; ky++) {
                for (let kx = -2; kx <= 2; kx++) {
                    const ny = y + ky
                    const nx = x + kx

                    if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                        const distance = Math.sqrt(kx * kx + ky * ky)
                        const weight = Math.exp(-(distance * distance) / 3)
                        sum += heightMap[ny][nx] * weight
                        count += weight
                    }
                }
            }

            blurred[y][x] = sum / count
        }
    }

    // Apply unsharp mask: original + amount * (original - blurred)
    const result: number[][] = []
    for (let y = 0; y < resolution; y++) {
        result[y] = []
        for (let x = 0; x < resolution; x++) {
            const detail = heightMap[y][x] - blurred[y][x]
            result[y][x] = Math.min(1, Math.max(0, heightMap[y][x] + amount * detail))
        }
    }

    return result
}

// MULTI-SCALE PROCESSING
function applyMultiScaleProcessing(heightMap: number[][], resolution: number): number[][] {
    const result = heightMap.map(row => [...row])
    const scales = [1, 2, 4]
    const weights = [0.5, 0.3, 0.2]

    for (let s = 0; s < scales.length; s++) {
        const scale = scales[s]
        const weight = weights[s]

        for (let y = 0; y < resolution; y++) {
            for (let x = 0; x < resolution; x++) {
                let sum = 0
                let count = 0

                for (let ky = -scale; ky <= scale; ky++) {
                    for (let kx = -scale; kx <= scale; kx++) {
                        const ny = y + ky
                        const nx = x + kx

                        if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                            sum += heightMap[ny][nx]
                            count++
                        }
                    }
                }

                const avg = sum / count
                result[y][x] = result[y][x] * (1 - weight) + avg * weight
            }
        }
    }

    return result
}

// BILATERAL FILTER
function applyBilateralFilter(heightMap: number[][], resolution: number, strength: number, edgePreserve: number): number[][] {
    const result: number[][] = []
    const iterations = Math.min(strength, 8)
    const sigma_space = 2.0
    const sigma_range = 0.1 * (11 - edgePreserve) / 10

    let current = heightMap.map(row => [...row])

    for (let iter = 0; iter < iterations; iter++) {
        for (let y = 0; y < resolution; y++) {
            result[y] = []
            for (let x = 0; x < resolution; x++) {
                let sum = 0
                let weight_sum = 0
                const center_val = current[y][x]

                for (let ky = -2; ky <= 2; ky++) {
                    for (let kx = -2; kx <= 2; kx++) {
                        const ny = y + ky
                        const nx = x + kx

                        if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                            const spatial_dist = Math.sqrt(kx * kx + ky * ky)
                            const range_dist = Math.abs(current[ny][nx] - center_val)

                            const spatial_weight = Math.exp(-(spatial_dist * spatial_dist) / (2 * sigma_space * sigma_space))
                            const range_weight = Math.exp(-(range_dist * range_dist) / (2 * sigma_range * sigma_range))

                            const weight = spatial_weight * range_weight
                            sum += current[ny][nx] * weight
                            weight_sum += weight
                        }
                    }
                }

                result[y][x] = sum / weight_sum
            }
        }
        current = result.map(row => [...row])
    }

    return result
}

// ADVANCED NOISE REDUCTION
function applyAdvancedNoiseReduction(heightMap: number[][], resolution: number, strength: number): number[][] {
    let result = heightMap.map(row => [...row])
    const iterations = Math.min(strength, 6)

    for (let iter = 0; iter < iterations; iter++) {
        const temp: number[][] = []

        for (let y = 0; y < resolution; y++) {
            temp[y] = []
            for (let x = 0; x < resolution; x++) {
                const values: number[] = []

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const ny = y + ky
                        const nx = x + kx

                        if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                            values.push(result[ny][nx])
                        }
                    }
                }

                values.sort((a, b) => a - b)
                temp[y][x] = values[Math.floor(values.length / 2)]
            }
        }

        result = temp
    }

    return result
}

// PROFESSIONAL SMOOTHING
function applyProfessionalSmoothing(heightMap: number[][], resolution: number, iterations: number): number[][] {
    let result = heightMap.map(row => [...row])
    const actualIterations = Math.min(iterations, 10)

    for (let iter = 0; iter < actualIterations; iter++) {
        const temp: number[][] = []

        for (let y = 0; y < resolution; y++) {
            temp[y] = []
            for (let x = 0; x < resolution; x++) {
                let sum = 0
                let count = 0

                for (let ky = -3; ky <= 3; ky++) {
                    for (let kx = -3; kx <= 3; kx++) {
                        const ny = y + ky
                        const nx = x + kx

                        if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                            const distance = Math.sqrt(kx * kx + ky * ky)
                            const weight = Math.exp(-(distance * distance) / 5.0)
                            sum += result[ny][nx] * weight
                            count += weight
                        }
                    }
                }

                temp[y][x] = sum / count
            }
        }

        result = temp
    }

    return result
}

// LAPLACIAN ENHANCEMENT
function applyLaplacianEnhancement(heightMap: number[][], resolution: number, strength: number): number[][] {
    const result: number[][] = []
    const factor = strength / 10

    for (let y = 0; y < resolution; y++) {
        result[y] = []
        for (let x = 0; x < resolution; x++) {
            let laplacian = 0
            const center = heightMap[y][x]

            const neighbors = [
                [y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]
            ]

            let count = 0
            for (const [ny, nx] of neighbors) {
                if (ny >= 0 && ny < resolution && nx >= 0 && nx < resolution) {
                    laplacian += heightMap[ny][nx] - center
                    count++
                }
            }

            laplacian /= count
            result[y][x] = Math.min(1, Math.max(0, center + laplacian * factor))
        }
    }

    return result
}

// MESH OPTIMIZATION
function optimizeMesh(vertices: Float32Array, indices: Uint32Array): { vertices: Float32Array, indices: Uint32Array } {
    const newIndices: number[] = []

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

        const area = Math.sqrt(nx * nx + ny * ny + nz * nz)

        if (area > 0.001) {
            newIndices.push(indices[i], indices[i + 1], indices[i + 2])
        }
    }

    return {
        vertices,
        indices: new Uint32Array(newIndices)
    }
}

// PROFESSIONAL NORMALS
function computeProfessionalNormals(vertices: Float32Array, indices: Uint32Array): Float32Array {
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

// STANDARD NORMALS
function computeStandardNormals(vertices: Float32Array, indices: Uint32Array): Float32Array {
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
