/**
 * Dithering Algorithms Library
 * Professional dithering algorithms for image conversion
 */

export type DitheringMode =
    | 'grayscale'
    | 'threshold'
    | 'floyd-steinberg'
    | 'atkinson'
    | 'sierra-lite'
    | 'stucki'
    | 'burkes'

/**
 * Convert to grayscale
 */
export function toGrayscale(imageData: ImageData): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const result: boolean[][] = []

    for (let y = 0; y < height; y++) {
        result[y] = []
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
            result[y][x] = gray > 128
        }
    }

    return result
}

/**
 * Simple threshold dithering
 */
export function threshold(imageData: ImageData, thresholdValue: number = 128): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const result: boolean[][] = []

    for (let y = 0; y < height; y++) {
        result[y] = []
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
            result[y][x] = gray > thresholdValue
        }
    }

    return result
}

/**
 * Floyd-Steinberg error diffusion dithering
 */
export function floydSteinberg(imageData: ImageData): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    // Convert to grayscale working buffer
    const gray = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            gray[y * width + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
        }
    }

    // Apply Floyd-Steinberg dithering
    const result: boolean[][] = []
    for (let y = 0; y < height; y++) {
        result[y] = []
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const oldPixel = gray[idx]
            const newPixel = oldPixel > 128 ? 255 : 0
            result[y][x] = newPixel > 128

            const error = oldPixel - newPixel

            // Distribute error to neighbors
            if (x + 1 < width) gray[idx + 1] += error * 7 / 16
            if (y + 1 < height) {
                if (x > 0) gray[idx + width - 1] += error * 3 / 16
                gray[idx + width] += error * 5 / 16
                if (x + 1 < width) gray[idx + width + 1] += error * 1 / 16
            }
        }
    }

    return result
}

/**
 * Atkinson dithering (sharper, Mac Classic style)
 */
export function atkinson(imageData: ImageData): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    const gray = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            gray[y * width + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
        }
    }

    const result: boolean[][] = []
    for (let y = 0; y < height; y++) {
        result[y] = []
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const oldPixel = gray[idx]
            const newPixel = oldPixel > 128 ? 255 : 0
            result[y][x] = newPixel > 128

            const error = (oldPixel - newPixel) / 8

            // Atkinson kernel
            if (x + 1 < width) gray[idx + 1] += error
            if (x + 2 < width) gray[idx + 2] += error
            if (y + 1 < height) {
                if (x > 0) gray[idx + width - 1] += error
                gray[idx + width] += error
                if (x + 1 < width) gray[idx + width + 1] += error
            }
            if (y + 2 < height) {
                gray[idx + width * 2] += error
            }
        }
    }

    return result
}

/**
 * Sierra-Lite dithering (fast and smooth)
 */
export function sierraLite(imageData: ImageData): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    const gray = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            gray[y * width + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
        }
    }

    const result: boolean[][] = []
    for (let y = 0; y < height; y++) {
        result[y] = []
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const oldPixel = gray[idx]
            const newPixel = oldPixel > 128 ? 255 : 0
            result[y][x] = newPixel > 128

            const error = oldPixel - newPixel

            // Sierra-Lite kernel: [2]
            //                      [1 1]
            if (x + 1 < width) gray[idx + 1] += error * 2 / 4
            if (y + 1 < height) {
                if (x > 0) gray[idx + width - 1] += error * 1 / 4
                gray[idx + width] += error * 1 / 4
            }
        }
    }

    return result
}

/**
 * Stucki dithering (high quality)
 */
export function stucki(imageData: ImageData): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    const gray = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            gray[y * width + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
        }
    }

    const result: boolean[][] = []
    for (let y = 0; y < height; y++) {
        result[y] = []
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const oldPixel = gray[idx]
            const newPixel = oldPixel > 128 ? 255 : 0
            result[y][x] = newPixel > 128

            const error = oldPixel - newPixel

            // Stucki kernel
            if (x + 1 < width) gray[idx + 1] += error * 8 / 42
            if (x + 2 < width) gray[idx + 2] += error * 4 / 42
            if (y + 1 < height) {
                if (x > 1) gray[idx + width - 2] += error * 2 / 42
                if (x > 0) gray[idx + width - 1] += error * 4 / 42
                gray[idx + width] += error * 8 / 42
                if (x + 1 < width) gray[idx + width + 1] += error * 4 / 42
                if (x + 2 < width) gray[idx + width + 2] += error * 2 / 42
            }
            if (y + 2 < height) {
                if (x > 1) gray[idx + width * 2 - 2] += error * 1 / 42
                if (x > 0) gray[idx + width * 2 - 1] += error * 2 / 42
                gray[idx + width * 2] += error * 4 / 42
                if (x + 1 < width) gray[idx + width * 2 + 1] += error * 2 / 42
                if (x + 2 < width) gray[idx + width * 2 + 2] += error * 1 / 42
            }
        }
    }

    return result
}

/**
 * Burkes dithering (balanced quality/speed)
 */
export function burkes(imageData: ImageData): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    const gray = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            gray[y * width + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
        }
    }

    const result: boolean[][] = []
    for (let y = 0; y < height; y++) {
        result[y] = []
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const oldPixel = gray[idx]
            const newPixel = oldPixel > 128 ? 255 : 0
            result[y][x] = newPixel > 128

            const error = oldPixel - newPixel

            // Burkes kernel
            if (x + 1 < width) gray[idx + 1] += error * 8 / 32
            if (x + 2 < width) gray[idx + 2] += error * 4 / 32
            if (y + 1 < height) {
                if (x > 1) gray[idx + width - 2] += error * 2 / 32
                if (x > 0) gray[idx + width - 1] += error * 4 / 32
                gray[idx + width] += error * 8 / 32
                if (x + 1 < width) gray[idx + width + 1] += error * 4 / 32
                if (x + 2 < width) gray[idx + width + 2] += error * 2 / 32
            }
        }
    }

    return result
}

/**
 * Apply selected dithering algorithm
 */
export function applyDithering(
    imageData: ImageData,
    mode: DitheringMode,
    thresholdValue: number = 128
): boolean[][] {
    switch (mode) {
        case 'grayscale':
            return toGrayscale(imageData)
        case 'threshold':
            return threshold(imageData, thresholdValue)
        case 'floyd-steinberg':
            return floydSteinberg(imageData)
        case 'atkinson':
            return atkinson(imageData)
        case 'sierra-lite':
            return sierraLite(imageData)
        case 'stucki':
            return stucki(imageData)
        case 'burkes':
            return burkes(imageData)
        default:
            return threshold(imageData, thresholdValue)
    }
}
