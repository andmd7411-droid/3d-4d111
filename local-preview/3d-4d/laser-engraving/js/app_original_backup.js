
// Error handler
window.onerror = function (msg, url, line) {
    alert("Error: " + msg + "\nLine: " + line);
    return false;
};

let processTimeout = null;
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const fileInput = document.getElementById('fileInput');

// State
let originalImage = null;
let isComparing = false;
let currentSettings = {
    brightness: 0,
    contrast: 0,
    gamma: 1.0,
    denoise: 0,
    blur: 0,
    strength: 0,
    sharpen: 0,
    invert: false,
    resize: 0,
    dither: 'grayscale',
    threshold: 128
};

// Controls
const rngBrightness = document.getElementById('rngBrightness');
const rngContrast = document.getElementById('rngContrast');
const rngGamma = document.getElementById('rngGamma');
const rngDenoise = document.getElementById('rngDenoise');
const rngSharpen = document.getElementById('rngSharpen');
const chkInvert = document.getElementById('chkInvert');
const selResize = document.getElementById('selResize');
const selDither = document.getElementById('selDither');
const rngThreshold = document.getElementById('rngThreshold');
const thresholdControl = document.getElementById('thresholdControl');
const btnAutoEnhance = document.getElementById('btnAutoEnhance');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);

const updateVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
};

const debouncedProcess = (highQuality = false) => {
    if (processTimeout) clearTimeout(processTimeout);

    if (!highQuality) {
        processImage(false); // Quick preview
        processTimeout = setTimeout(() => processImage(true), 500); // Delayed high quality
    } else {
        processImage(true);
    }
};

rngBrightness.addEventListener('input', (e) => {
    currentSettings.brightness = parseInt(e.target.value);
    updateVal('valBrightness', currentSettings.brightness);
    debouncedProcess();
});
rngContrast.addEventListener('input', (e) => {
    currentSettings.contrast = parseInt(e.target.value);
    updateVal('valContrast', currentSettings.contrast);
    debouncedProcess();
});
rngGamma.addEventListener('input', (e) => {
    currentSettings.gamma = parseFloat(e.target.value) / 100;
    updateVal('valGamma', currentSettings.gamma.toFixed(2));
    debouncedProcess();
});
rngDenoise.addEventListener('input', (e) => {
    currentSettings.denoise = parseInt(e.target.value);
    updateVal('valDenoise', currentSettings.denoise);
    debouncedProcess();
});
rngBlur.addEventListener('input', (e) => {
    currentSettings.blur = parseInt(e.target.value);
    updateVal('valBlur', currentSettings.blur);
    debouncedProcess();
});
rngStrength.addEventListener('input', (e) => {
    currentSettings.strength = parseInt(e.target.value);
    updateVal('valStrength', currentSettings.strength);
    debouncedProcess();
});
rngSharpen.addEventListener('input', (e) => {
    currentSettings.sharpen = parseInt(e.target.value);
    updateVal('valSharpen', currentSettings.sharpen);
    debouncedProcess();
});
chkInvert.addEventListener('change', (e) => {
    currentSettings.invert = e.target.checked;
    debouncedProcess();
});
btnAutoEnhance.addEventListener('click', applyAutoEnhance);
document.getElementById('btnPresetPhoto').addEventListener('click', () => applyPreset('photo'));
document.getElementById('btnPresetLogo').addEventListener('click', () => applyPreset('logo'));
document.getElementById('btnPresetCut').addEventListener('click', () => applyPreset('cut'));
document.getElementById('btnReset').addEventListener('click', () => applyPreset('reset'));
document.getElementById('btnAutoThreshold').addEventListener('click', applyOtsuThreshold);

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportBMP();
    }
    if (e.key === 'r') {
        applyPreset('reset');
    }
    if (e.key === ' ') {
        e.preventDefault();
        toggleCompare();
    }
});

function toggleCompare() {
    isComparing = !isComparing;
    processImage(true);
}

selResize.addEventListener('change', (e) => {
    currentSettings.resize = parseInt(e.target.value);
    debouncedProcess(true);
});
selDither.addEventListener('change', (e) => {
    currentSettings.dither = e.target.value;
    if (currentSettings.dither === 'threshold') {
        thresholdControl.classList.remove('hidden');
    } else {
        thresholdControl.classList.add('hidden');
    }
    debouncedProcess(true);
});
rngThreshold.addEventListener('input', (e) => {
    currentSettings.threshold = parseInt(e.target.value);
    updateVal('valThreshold', currentSettings.threshold);
    debouncedProcess();
});

document.getElementById('btnExportBMP').addEventListener('click', () => { try { exportBMP(); } catch (e) { alert(e); } });
document.getElementById('btnExportDXF').addEventListener('click', () => { try { exportDXF(); } catch (e) { alert(e); } });
document.getElementById('btnExportSVG').addEventListener('click', () => { try { exportSVG(); } catch (e) { alert(e); } });

// Drag & Drop
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadImage(e.dataTransfer.files[0]);
    }
});

function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            document.getElementById('dropText').classList.add('hidden');
            processImage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function processImage(highQuality = true) {
    if (!originalImage) return;

    // 1. Resize Calculation
    let w = originalImage.width;
    let h = originalImage.height;

    // Low res preview if not highQuality
    const PREVIEW_MAX = 600;
    if (!highQuality && w > PREVIEW_MAX) {
        const ratio = PREVIEW_MAX / w;
        w = PREVIEW_MAX;
        h = h * ratio;
    } else if (currentSettings.resize > 0 && w > currentSettings.resize) {
        const ratio = currentSettings.resize / w;
        w = currentSettings.resize;
        h = h * ratio;
    }

    canvas.width = w;
    canvas.height = h;

    // Draw Original
    ctx.drawImage(originalImage, 0, 0, w, h);

    if (isComparing) {
        // Just show original
        return;
    }

    // Get Data
    let imgData = ctx.getImageData(0, 0, w, h);

    // 2. Pre-processing: Denoise & Blur
    if (currentSettings.denoise > 0) {
        // Fast path for low quality: smaller radius
        const dRadius = highQuality ? currentSettings.denoise : Math.min(10, currentSettings.denoise);
        imgData = applyDenoise(imgData, dRadius);
    }

    if (currentSettings.blur > 0) {
        imgData = applyBlur(imgData, currentSettings.blur / 20);
    }

    // 3. Pre-processing: Sharpening
    if (currentSettings.sharpen > 0) {
        imgData = applySharpen(imgData, currentSettings.sharpen / 100);
    }

    const data = imgData.data;

    // 4. Grayscale & Brightness/Contrast/Gamma/Invert
    const contrast = currentSettings.contrast;
    const brightness = currentSettings.brightness;
    const gamma = currentSettings.gamma;
    const invert = currentSettings.invert;

    // Pre-calculate Gamma LUT
    const gammaLUT = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        gammaLUT[i] = Math.pow(i / 255, 1 / gamma) * 255;
    }

    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Gray
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Contrast
        gray = contrastFactor * (gray - 128) + 128;

        // Brightness
        gray += brightness;

        // Gamma
        gray = gammaLUT[Math.min(255, Math.max(0, Math.round(gray)))];

        // Invert
        if (invert) gray = 255 - gray;

        // Clamp
        gray = Math.min(255, Math.max(0, gray));

        data[i] = data[i + 1] = data[i + 2] = gray;
    }

    // 5. Mode Selection (Dithering / Edge Detection)
    if (currentSettings.dither === 'threshold') {
        const thresh = currentSettings.threshold;
        for (let i = 0; i < data.length; i += 4) {
            const v = data[i] > thresh ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v;
        }
    } else if (currentSettings.dither === 'edge') {
        applyEdgeDetection(imgData);
    } else if (currentSettings.dither !== 'grayscale') {
        // Dithering is slow, skip for low quality if image is large
        if (highQuality || w < 800) {
            applyAdvancedDither(imgData, currentSettings.dither);
        }
    }

    ctx.putImageData(imgData, 0, 0);
}

function applyAutoEnhance() {
    if (!originalImage) {
        alert("Please load an image first!");
        return;
    }

    // Simple Histogram Equalization for Grayscale
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const hist = new Uint32Array(256);
    for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        hist[Math.min(255, Math.max(0, gray))]++;
    }

    const cdf = new Uint32Array(256);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + hist[i];

    const cdfMin = cdf.find(x => x > 0);
    const total = w * h;
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        lut[i] = Math.round(((cdf[i] - cdfMin) / (total - cdfMin)) * 255);
    }

    // Since we want to update the settings to reflect this, we'll actually 
    // just apply it to the base image data or adjust brightness/contrast?
    // Histogram equalization is better as a filter.
    // Let's reset settings to defaults first to avoid double processing
    currentSettings.brightness = 0;
    currentSettings.contrast = 0;
    currentSettings.gamma = 1.0;

    updateVal('valBrightness', 0);
    updateVal('valContrast', 0);
    updateVal('valGamma', "1.00");

    document.getElementById('rngBrightness').value = 0;
    document.getElementById('rngContrast').value = 0;
    document.getElementById('rngGamma').value = 100;

    processImage();

    // Now apply LUT to current canvas
    const finalData = ctx.getImageData(0, 0, w, h);
    const fd = finalData.data;
    for (let i = 0; i < fd.length; i += 4) {
        fd[i] = fd[i + 1] = fd[i + 2] = lut[fd[i]];
    }
    ctx.putImageData(finalData, 0, 0);
}

function applyDenoise(imgData, radius) {
    if (radius === 0) return imgData;
    const w = imgData.width;
    const h = imgData.height;
    const input = imgData.data;
    const output = new Uint8ClampedArray(input.length);

    // Performance limit for radius
    const r = Math.min(2, Math.floor(radius / 10) + 1);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const vals = [];
            for (let ky = -r; ky <= r; ky++) {
                const ny = y + ky;
                if (ny < 0 || ny >= h) continue;
                for (let kx = -r; kx <= r; kx++) {
                    const nx = x + kx;
                    if (nx >= 0 && nx < w) {
                        vals.push(input[(ny * w + nx) * 4]);
                    }
                }
            }
            // Faster median for small arrays
            vals.sort((a, b) => a - b);
            const median = vals[Math.floor(vals.length / 2)];
            const idx = (y * w + x) * 4;
            output[idx] = output[idx + 1] = output[idx + 2] = median;
            output[idx + 3] = 255;
        }
    }
    return new ImageData(output, w, h);
}

function applySharpen(imgData, amount) {
    if (amount === 0) return imgData;
    const w = imgData.width;
    const h = imgData.height;
    const input = imgData.data;
    const output = new Uint8ClampedArray(input.length);

    // Professional Unsharp Mask (approximate with a quick 3x3 Gaussian-ish blur)
    // blurred = 1/16 [1 2 1, 2 4 2, 1 2 1]
    const kernel = [
        1 / 16, 2 / 16, 1 / 16,
        2 / 16, 4 / 16, 2 / 16,
        1 / 16, 2 / 16, 1 / 16
    ];

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
                let blurred = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        blurred += input[((y + ky) * w + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
                    }
                }

                // USM formula: sharpened = original + (original - blurred) * amount
                let original = input[idx + c];
                let sharpened = original + (original - blurred) * (amount * 5); // boosted amount for visible effect
                output[idx + c] = Math.min(255, Math.max(0, sharpened));
            }
            output[idx + 3] = 255;
        }
    }
    return new ImageData(output, w, h);
}

function applyPreset(type) {
    // Reset to defaults first
    currentSettings = {
        brightness: 0, contrast: 0, gamma: 1.0, denoise: 0, blur: 0, strength: 0, sharpen: 0,
        invert: false, resize: 0, dither: 'grayscale', threshold: 128
    };

    if (type === 'photo') {
        currentSettings.gamma = 1.1;
        currentSettings.blur = 10;
        currentSettings.sharpen = 25;
        currentSettings.dither = 'stucki';
    } else if (type === 'logo') {
        currentSettings.contrast = 40;
        currentSettings.dither = 'threshold';
        currentSettings.threshold = 140;
    } else if (type === 'cut') {
        currentSettings.blur = 15;
        currentSettings.strength = 15;
        currentSettings.dither = 'edge';
        currentSettings.threshold = 60;
    }

    // Update UI
    document.getElementById('rngBrightness').value = currentSettings.brightness;
    document.getElementById('rngContrast').value = currentSettings.contrast;
    document.getElementById('rngGamma').value = currentSettings.gamma * 100;
    document.getElementById('rngDenoise').value = currentSettings.denoise;
    document.getElementById('rngBlur').value = currentSettings.blur;
    document.getElementById('rngStrength').value = currentSettings.strength;
    document.getElementById('rngSharpen').value = currentSettings.sharpen;
    document.getElementById('chkInvert').checked = currentSettings.invert;
    document.getElementById('selDither').value = currentSettings.dither;
    document.getElementById('rngThreshold').value = currentSettings.threshold;

    updateVal('valBrightness', currentSettings.brightness);
    updateVal('valContrast', currentSettings.contrast);
    updateVal('valGamma', currentSettings.gamma.toFixed(2));
    updateVal('valDenoise', currentSettings.denoise);
    updateVal('valBlur', currentSettings.blur);
    updateVal('valStrength', currentSettings.strength);
    updateVal('valSharpen', currentSettings.sharpen);
    updateVal('valThreshold', currentSettings.threshold);

    if (currentSettings.dither === 'threshold') {
        thresholdControl.classList.remove('hidden');
    } else {
        thresholdControl.classList.add('hidden');
    }

    debouncedProcess(true);
}

function applyOtsuThreshold() {
    if (!originalImage) {
        alert("Please load an image first!");
        return;
    }
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // 1. Histogram
    const hist = new Uint32Array(256);
    for (let i = 0; i < data.length; i += 4) {
        hist[data[i]]++;
    }

    // 2. Otsu Algorithm
    let total = w * h;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 128;

    for (let i = 0; i < 256; i++) {
        wB += hist[i];
        if (wB === 0) continue;
        wF = total - wB;
        if (wF === 0) break;

        sumB += i * hist[i];
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let varBetween = wB * wF * (mB - mF) * (mB - mF);
        if (varBetween > varMax) {
            varMax = varBetween;
            threshold = i;
        }
    }

    // Update settings and UI
    currentSettings.threshold = threshold;
    document.getElementById('rngThreshold').value = threshold;
    updateVal('valThreshold', threshold);
    debouncedProcess(true);
}

function applyBlur(imgData, sigma) {
    if (sigma === 0) return imgData;
    const w = imgData.width;
    const h = imgData.height;
    const input = imgData.data;
    const output = new Uint8ClampedArray(input.length);
    const radius = Math.ceil(sigma * 2);

    // Gaussian kernel (approximate with 2D box if sigma is small, or full Gaussian)
    // For performance, we use 2-pass 1D convolution
    const kernel = [];
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
        const val = Math.exp(-(i * i) / (2 * sigma * sigma));
        kernel.push(val);
        sum += val;
    }
    for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

    const temp = new Float32Array(input.length);

    // Pass 1: Horizontal
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            for (let k = -radius; k <= radius; k++) {
                let nx = Math.min(w - 1, Math.max(0, x + k));
                let idx = (y * w + nx) * 4;
                let kw = kernel[k + radius];
                r += input[idx] * kw;
                g += input[idx + 1] * kw;
                b += input[idx + 2] * kw;
                a += input[idx + 3] * kw;
            }
            let oIdx = (y * w + x) * 4;
            temp[oIdx] = r;
            temp[oIdx + 1] = g;
            temp[oIdx + 2] = b;
            temp[oIdx + 3] = a;
        }
    }

    // Pass 2: Vertical
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            for (let k = -radius; k <= radius; k++) {
                let ny = Math.min(h - 1, Math.max(0, y + k));
                let idx = (ny * w + x) * 4;
                let kw = kernel[k + radius];
                r += temp[idx] * kw;
                g += temp[idx + 1] * kw;
                b += temp[idx + 2] * kw;
                a += temp[idx + 3] * kw;
            }
            let oIdx = (y * w + x) * 4;
            output[oIdx] = r;
            output[oIdx + 1] = g;
            output[oIdx + 2] = b;
            output[oIdx + 3] = a;
        }
    }
    return new ImageData(output, w, h);
}

function applyEdgeDetection(imgData) {
    const w = imgData.width;
    const h = imgData.height;
    const data = imgData.data;

    // 1. Grayscale Float Buffer
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        gray[i] = data[i * 4];
    }

    // 2. Sobel Gradients & Directions
    const mag = new Float32Array(w * h);
    const dir = new Float32Array(w * h);

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const gx = (
                -1 * gray[(y - 1) * w + (x - 1)] + 1 * gray[(y - 1) * w + (x + 1)] +
                -2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)] +
                -1 * gray[(y + 1) * w + (x - 1)] + 1 * gray[(y + 1) * w + (x + 1)]
            );
            const gy = (
                -1 * gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - 1 * gray[(y - 1) * w + (x + 1)] +
                1 * gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + 1 * gray[(y + 1) * w + (x + 1)]
            );

            mag[idx] = Math.sqrt(gx * gx + gy * gy);
            let angle = Math.atan2(gy, gx) * (180 / Math.PI);
            if (angle < 0) angle += 180;
            dir[idx] = angle;
        }
    }

    // 3. Non-Maximum Suppression (Thins edges to 1px)
    const nms = new Uint8ClampedArray(w * h);
    const lowThresh = currentSettings.threshold * 0.4; // Low threshold for hysteresis
    const highThresh = currentSettings.threshold;

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const m = mag[idx];
            if (m < lowThresh) continue;

            const angle = dir[idx];
            let n1 = 0, n2 = 0;

            if ((angle >= 157.5) || (angle < 22.5)) {
                n1 = mag[idx - 1]; n2 = mag[idx + 1];
            } else if (angle >= 22.5 && angle < 67.5) {
                n1 = mag[idx - w - 1]; n2 = mag[idx + w + 1];
            } else if (angle >= 67.5 && angle < 112.5) {
                n1 = mag[idx - w]; n2 = mag[idx + w];
            } else {
                n1 = mag[idx - w + 1]; n2 = mag[idx + w - 1];
            }

            if (m >= n1 && m >= n2) {
                // Potential edge
                if (m >= highThresh) {
                    nms[idx] = 255; // Strong edge
                } else {
                    nms[idx] = 127; // Weak edge (candidate for tracking)
                }
            }
        }
    }

    // 4. Hysteresis (Edge Tracking)
    // Strong pixels rescue neighboring weak pixels recursively
    const finalEdges = new Uint8ClampedArray(w * h);
    const stack = [];

    for (let i = 0; i < w * h; i++) {
        if (nms[i] === 255) {
            stack.push(i);
            finalEdges[i] = 255;
        }
    }

    while (stack.length > 0) {
        const idx = stack.pop();
        const y = Math.floor(idx / w);
        const x = idx % w;

        // Check 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                const nIdx = ny * w + nx;
                if (nms[nIdx] === 127 && finalEdges[nIdx] === 0) {
                    finalEdges[nIdx] = 255;
                    stack.push(nIdx);
                }
            }
        }
    }

    // 5. Line Strength (Morphological Dilation)
    // Bridges gaps if user increases "Line Strength" slider
    let result = finalEdges;
    if (currentSettings.strength > 0) {
        result = new Uint8ClampedArray(w * h);
        const radius = Math.ceil(currentSettings.strength / 40);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (finalEdges[y * w + x] === 255) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const nx = x + dx; const ny = y + dy;
                            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                result[ny * w + nx] = 255;
                            }
                        }
                    }
                }
            }
        }
    }

    // Update image data
    for (let i = 0; i < w * h; i++) {
        const v = result[i];
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
        data[i * 4 + 3] = 255;
    }
}

function applyAdvancedDither(imgData, type) {
    const w = imgData.width;
    const h = imgData.height;
    const data = imgData.data;

    const kernels = {
        'floyd': [
            { x: 1, y: 0, w: 7 / 16 },
            { x: -1, y: 1, w: 3 / 16 },
            { x: 0, y: 1, w: 5 / 16 },
            { x: 1, y: 1, w: 1 / 16 }
        ],
        'atkinson': [
            { x: 1, y: 0, w: 1 / 8 },
            { x: 2, y: 0, w: 1 / 8 },
            { x: -1, y: 1, w: 1 / 8 },
            { x: 0, y: 1, w: 1 / 8 },
            { x: 1, y: 1, w: 1 / 8 },
            { x: 0, y: 2, w: 1 / 8 }
        ],
        'sierra': [
            { x: 1, y: 0, w: 2 / 4 },
            { x: -1, y: 1, w: 1 / 4 },
            { x: 0, y: 1, w: 1 / 4 }
        ],
        'stucki': [
            { x: 1, y: 0, w: 8 / 42 }, { x: 2, y: 0, w: 4 / 42 },
            { x: -2, y: 1, w: 2 / 42 }, { x: -1, y: 1, w: 4 / 42 }, { x: 0, y: 1, w: 8 / 42 }, { x: 1, y: 1, w: 4 / 42 }, { x: 2, y: 1, w: 2 / 42 },
            { x: -2, y: 2, w: 1 / 42 }, { x: -1, y: 2, w: 2 / 42 }, { x: 0, y: 2, w: 4 / 42 }, { x: 1, y: 2, w: 2 / 42 }, { x: 2, y: 2, w: 1 / 42 }
        ]
    };

    const kernel = kernels[type] || kernels['floyd'];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const oldPixel = data[idx];
            const newPixel = oldPixel < 128 ? 0 : 255;

            data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

            const quantError = oldPixel - newPixel;

            for (const k of kernel) {
                const nx = x + k.x;
                const ny = y + k.y;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nidx = (ny * w + nx) * 4;
                    data[nidx] = Math.min(255, Math.max(0, data[nidx] + quantError * k.w));
                    data[nidx + 1] = data[nidx];
                    data[nidx + 2] = data[nidx];
                }
            }
        }
    }
}

function exportBMP() {
    if (!originalImage) {
        alert("Please load an image first!");
        return;
    }
    const link = document.createElement('a');
    link.download = 'engraving_ready.bmp';
    link.href = canvas.toDataURL('image/bmp');
    if (link.href.startsWith("data:image/png")) {
        link.download = 'engraving_ready.png';
    }
    link.click();
}

function exportDXF() {
    if (!originalImage) {
        alert("Please load an image first!");
        return;
    }

    if (currentSettings.dither === 'floyd' || currentSettings.dither === 'grayscale') {
        const confirm = window.confirm("You are exporting a Dithered/Grayscale image to DXF.\nThis will create millions of points.\nRecommended: Use 'Threshold' or 'Edge Detection' mode for clean vectors.\n\nContinue anyway?");
        if (!confirm) return;
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const lines = Vectorizer.marchingSquares(imgData.data, canvas.width, canvas.height);

    if (lines.length === 0) {
        alert("No vectors found! Algorithm returned 0 lines.");
        return;
    }

    const dxfString = Vectorizer.generateDXF(lines);
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vector_cut.dxf';
    link.click();
}

function exportSVG() {
    if (!originalImage) {
        alert("Please load an image first!");
        return;
    }

    if (currentSettings.dither === 'floyd' || currentSettings.dither === 'grayscale') {
        const confirm = window.confirm("You are exporting a Dithered/Grayscale image to SVG.\nThis will create millions of points.\nRecommended: Use 'Threshold' or 'Edge Detection' mode for clean vectors.\n\nContinue anyway?");
        if (!confirm) return;
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const lines = Vectorizer.marchingSquares(imgData.data, canvas.width, canvas.height);

    if (lines.length === 0) {
        alert("No vectors found! Algorithm returned 0 lines.");
        return;
    }

    const svgString = Vectorizer.generateSVG(lines, canvas.width, canvas.height);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'vector_cut.svg';
    link.click();
}
