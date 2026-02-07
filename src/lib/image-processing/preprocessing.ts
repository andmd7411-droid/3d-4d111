/**
 * Image Preprocessing Library
 * Professional image processing functions for vectorization
 */

export interface PreprocessingOptions {
    gamma?: number
    denoise?: number
    sharpen?: number
    invert?: boolean
}

/**
 * Apply gamma correction for exposure/tone adjustment
 */
export function applyGamma(imageData: ImageData, gamma: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const lookupTable = new Uint8Array(256)

    // Build gamma correction lookup table
    for (let i = 0; i < 256; i++) {
        lookupTable[i] = Math.min(255, Math.max(0, Math.pow(i / 255, 1 / gamma) * 255))
    }

    // Apply to RGB channels (skip alpha)
    for (let i = 0; i < data.length; i += 4) {
        data[i] = lookupTable[data[i]]
        data[i + 1] = lookupTable[data[i + 1]]
        data[i + 2] = lookupTable[data[i + 2]]
    }

    return new ImageData(data, imageData.width, imageData.height)
}

/**
 * Apply median filter for noise reduction
 */
export function applyDenoise(imageData: ImageData, strength: number): ImageData {
    if (strength === 0) return imageData

    const width = imageData.width
    const height = imageData.height
    const data = new Uint8ClampedArray(imageData.data)
    const radius = Math.min(strength, 5)

    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const idx = (y * width + x) * 4

            // Get neighborhood pixels for each channel
            const rValues: number[] = []
            const gValues: number[] = []
            const bValues: number[] = []

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nIdx = ((y + dy) * width + (x + dx)) * 4
                    rValues.push(imageData.data[nIdx])
                    gValues.push(imageData.data[nIdx + 1])
                    bValues.push(imageData.data[nIdx + 2])
                }
            }

            // Apply median filter
            rValues.sort((a, b) => a - b)
            gValues.sort((a, b) => a - b)
            bValues.sort((a, b) => a - b)

            const mid = Math.floor(rValues.length / 2)
            data[idx] = rValues[mid]
            data[idx + 1] = gValues[mid]
            data[idx + 2] = bValues[mid]
        }
    }

    return new ImageData(data, width, height)
}

/**
 * Apply unsharp masking for edge sharpening
 */
export function applySharpen(imageData: ImageData, strength: number): ImageData {
    if (strength === 0) return imageData

    const width = imageData.width
    const height = imageData.height
    const data = new Uint8ClampedArray(imageData.data)
    const amount = strength / 10

    // First create blurred version
    const blurred = new Uint8ClampedArray(data.length)

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4

            for (let c = 0; c < 3; c++) {
                let sum = 0
                let count = 0

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nIdx = ((y + dy) * width + (x + dx)) * 4 + c
                        sum += imageData.data[nIdx]
                        count++
                    }
                }

                blurred[idx + c] = sum / count
            }
            blurred[idx + 3] = imageData.data[idx + 3]
        }
    }

    // Apply unsharp mask: original + amount * (original - blurred)
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            const detail = imageData.data[i + c] - blurred[i + c]
            data[i + c] = Math.min(255, Math.max(0, imageData.data[i + c] + amount * detail))
        }
    }

    return new ImageData(data, width, height)
}

/**
 * Invert image colors
 */
export function applyInvert(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)

    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]
        data[i + 1] = 255 - data[i + 1]
        data[i + 2] = 255 - data[i + 2]
    }

    return new ImageData(data, imageData.width, imageData.height)
}

/**
 * Auto-enhance using histogram equalization
 */
export function autoEnhance(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data)
    const histogram = new Array(256).fill(0)
    const totalPixels = imageData.width * imageData.height

    // Calculate histogram for luminance
    for (let i = 0; i < data.length; i += 4) {
        const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
        histogram[lum]++
    }

    // Calculate cumulative distribution
    const cdf = new Array(256)
    cdf[0] = histogram[0]
    for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i]
    }

    // Normalize CDF
    const cdfMin = cdf.find(v => v > 0) || 0
    const lookupTable = new Array(256)
    for (let i = 0; i < 256; i++) {
        lookupTable[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255)
    }

    // Apply equalization
    for (let i = 0; i < data.length; i += 4) {
        const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
        const newLum = lookupTable[lum]
        const factor = lum > 0 ? newLum / lum : 1

        data[i] = Math.min(255, Math.round(data[i] * factor))
        data[i + 1] = Math.min(255, Math.round(data[i + 1] * factor))
        data[i + 2] = Math.min(255, Math.round(data[i + 2] * factor))
    }

    return new ImageData(data, imageData.width, imageData.height)
}
