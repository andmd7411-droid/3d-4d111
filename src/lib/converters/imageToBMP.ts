interface BMPOptions {
    brightness?: number
    contrast?: number
    saturation?: number
    blur?: number
}

export async function convertToBMP(
    imageDataUrl: string,
    options: BMPOptions = {}
): Promise<string> {
    const { brightness = 100, contrast = 100, saturation = 100, blur = 0 } = options

    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }

            // Draw image
            ctx.drawImage(img, 0, 0)

            // Apply blur if needed
            if (blur > 0) {
                ctx.filter = `blur(${blur}px)`
                ctx.drawImage(canvas, 0, 0)
                ctx.filter = 'none'
            }

            // Apply brightness, contrast, and saturation
            if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data

                const brightnessAdjust = (brightness - 100) * 2.55
                const contrastFactor = (contrast / 100)
                const saturationFactor = (saturation / 100)

                for (let i = 0; i < data.length; i += 4) {
                    // Apply contrast
                    data[i] = ((data[i] - 128) * contrastFactor + 128)
                    data[i + 1] = ((data[i + 1] - 128) * contrastFactor + 128)
                    data[i + 2] = ((data[i + 2] - 128) * contrastFactor + 128)

                    // Apply brightness
                    data[i] = Math.min(255, Math.max(0, data[i] + brightnessAdjust))
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightnessAdjust))
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightnessAdjust))

                    // Apply saturation
                    const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2]
                    data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * saturationFactor))
                    data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * saturationFactor))
                    data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * saturationFactor))
                }

                ctx.putImageData(imageData, 0, 0)
            }

            // Convert to BMP data URL
            resolve(canvas.toDataURL('image/bmp'))
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = imageDataUrl
    })
}
