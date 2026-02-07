// =====================================================
// APP EXTENSIONS - New Features
// =====================================================

// Global state for new features
let comparisonMode = false;
let canvasZoom = 1.0;
let canvasPan = { x: 0, y: 0 };
let batchQueue = [];
let exportHistory = [];
let processingStartTime = 0;
let qualityMetrics = { time: 0, size: 0, paths: 0 };

// =====================================================
// 1. COMPARISON MODE
// =====================================================

const btnComparison = document.getElementById('btnComparison');
let originalCanvas = null;

btnComparison?.addEventListener('click', () => {
    comparisonMode = !comparisonMode;
    btnComparison.classList.toggle('active', comparisonMode);

    if (comparisonMode && originalImage) {
        // Save original to separate canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalImage.width;
        tempCanvas.height = originalImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(originalImage, 0, 0);
        originalCanvas = tempCanvas;
    }

    processImage(true);
});

// Override isComparing with our new mode
const originalProcessImage = processImage;
// Note: processImage is already defined in app.js with isComparing logic

// =====================================================
// 2. CANVAS ZOOM & PAN
// =====================================================

const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnResetView = document.getElementById('btnResetView');

btnZoomIn?.addEventListener('click', () => {
    canvasZoom = Math.min(5.0, canvasZoom * 1.2);
    applyCanvasTransform();
});

btnZoomOut?.addEventListener('click', () => {
    canvasZoom = Math.max(0.5, canvasZoom / 1.2);
    applyCanvasTransform();
});

btnResetView?.addEventListener('click', () => {
    canvasZoom = 1.0;
    canvasPan = { x: 0, y: 0 };
    applyCanvasTransform();
});

function applyCanvasTransform() {
    canvas.style.transform = `scale(${canvasZoom}) translate(${canvasPan.x}px, ${canvasPan.y}px)`;
}

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
        canvasZoom = Math.min(5.0, canvasZoom * 1.1);
    } else {
        canvasZoom = Math.max(0.5, canvasZoom / 1.1);
    }
    applyCanvasTransform();
});

// Click and drag pan
let isPanning = false;
let panStart = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        isPanning = true;
        panStart = { x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y };
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        canvasPan = {
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y
        };
        applyCanvasTransform();
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    canvas.style.cursor = 'default';
});

// =====================================================
// 3. KEYBOARD SHORTCUTS
// =====================================================

const btnShortcuts = document.getElementById('btnShortcuts');
const shortcutsPanel = document.getElementById('shortcutsPanel');

btnShortcuts?.addEventListener('click', () => {
    shortcutsPanel.classList.toggle('hidden');
});

// Enhanced keyboard shortcuts
window.addEventListener('keydown', (e) => {
    // Existing shortcuts are in app.js
    // Add new ones:

    if (e.key === '?') {
        e.preventDefault();
        shortcutsPanel.classList.toggle('hidden');
    }

    if (e.key === '1' && !e.ctrlKey) {
        e.preventDefault();
        applyPreset('photo');
    }

    if (e.key === '2' && !e.ctrlKey) {
        e.preventDefault();
        applyPreset('logo');
    }

    if (e.key === '3' && !e.ctrlKey) {
        e.preventDefault();
        applyPreset('cut');
    }

    if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        const sel = document.getElementById('selDither');
        if (sel.value !== 'edge') {
            sel.value = 'edge';
        } else {
            sel.value = 'threshold';
        }
        sel.dispatchEvent(new Event('change'));
    }
});

// =====================================================
// 4. BATCH PROCESSING
// =====================================================

const btnAddToQueue = document.getElementById('btnAddToQueue');
const btnProcessAll = document.getElementById('btnProcessAll');
const batchQueueEl = document.getElementById('batchQueue');

btnAddToQueue?.addEventListener('click', () => {
    if (!originalImage) {
        alert('Please load an image first!');
        return;
    }

    // Create thumbnail
    const thumb = document.createElement('canvas');
    thumb.width = 40;
    thumb.height = 40;
    const thumbCtx = thumb.getContext('2d');
    thumbCtx.drawImage(canvas, 0, 0, 40, 40);

    // Add to queue with current settings
    const queueItem = {
        image: originalImage,
        settings: { ...currentSettings },
        thumbnail: thumb.toDataURL()
    };

    batchQueue.push(queueItem);
    updateBatchQueueUI();

    // Show feedback
    btnAddToQueue.textContent = `✅ (${batchQueue.length})`;
    setTimeout(() => {
        btnAddToQueue.textContent = '➕ Add to Queue';
    }, 1500);
});

function updateBatchQueueUI() {
    batchQueueEl.innerHTML = '';

    if (batchQueue.length === 0) {
        batchQueueEl.innerHTML = '<div style="text-align: center; color: #666; padding: 20px; font-size: 12px;">Queue is empty</div>';
        return;
    }

    batchQueue.forEach((item, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.innerHTML = `
            <img src="${item.thumbnail}" class="queue-thumb" />
            <span style="flex: 1;">Image ${index + 1}</span>
            <button class="queue-remove" onclick="removeBatchItem(${index})">❌</button>
        `;
        batchQueueEl.appendChild(queueItem);
    });
}

window.removeBatchItem = function (index) {
    batchQueue.splice(index, 1);
    updateBatchQueueUI();
};

btnProcessAll?.addEventListener('click', async () => {
    if (batchQueue.length === 0) {
        alert('Queue is empty!');
        return;
    }

    btnProcessAll.disabled = true;
    btnProcessAll.textContent = '⏳ Processing...';

    const results = [];

    for (let i = 0; i < batchQueue.length; i++) {
        const item = batchQueue[i];

        // Restore image and settings
        originalImage = item.image;
        currentSettings = { ...item.settings };

        // Process
        processImage(true);
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow render

        // Export (just BMP for now in batch)
        const dataUrl = canvas.toDataURL('image/bmp');
        results.push({
            name: `batch_${i + 1}.bmp`,
            data: dataUrl
        });
    }

    // Download all as individual files (ZIP would require JSZip library)
    results.forEach((result, i) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = result.data;
            link.download = result.name;
            link.click();
        }, i * 500); // Stagger downloads
    });

    // Clear queue
    batchQueue = [];
    updateBatchQueueUI();

    btnProcessAll.disabled = false;
    btnProcessAll.textContent = '⚡ Process All';

    alert(`Processed ${results.length} images!`);
});

// Initialize
updateBatchQueueUI();

// =====================================================
// 5. EXPORT HISTORY
// =====================================================

const exportHistoryEl = document.getElementById('exportHistory');

function addToExportHistory(format, settings) {
    const timestamp = new Date().toLocaleTimeString();

    exportHistory.unshift({
        format,
        settings: { ...settings },
        timestamp
    });

    // Keep only last 10
    if (exportHistory.length > 10) {
        exportHistory = exportHistory.slice(0, 10);
    }

    // Save to localStorage
    try {
        localStorage.setItem('laserStudioExportHistory', JSON.stringify(exportHistory));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }

    updateExportHistoryUI();
}

function updateExportHistoryUI() {
    exportHistoryEl.innerHTML = '';

    if (exportHistory.length === 0) {
        exportHistoryEl.innerHTML = '<div style="text-align: center; color: #666; padding: 10px; font-size: 11px;">No exports yet</div>';
        return;
    }

    exportHistory.forEach((item, index) => {
        const histItem = document.createElement('div');
        histItem.className = 'history-item';
        histItem.innerHTML = `
            <span>${item.format.toUpperCase()} - ${item.timestamp}</span>
            <button class="history-reuse" onclick="reuseSettings(${index})">⚙️ Reuse</button>
        `;
        exportHistoryEl.appendChild(histItem);
    });
}

window.reuseSettings = function (index) {
    const item = exportHistory[index];
    currentSettings = { ...item.settings };

    // Update UI sliders
    Object.keys(currentSettings).forEach(key => {
        const input = document.getElementById(`rng${key.charAt(0).toUpperCase() + key.slice(1)}`);
        const checkbox = document.getElementById(`chk${key.charAt(0).toUpperCase() + key.slice(1)}`);
        const select = document.getElementById(`sel${key.charAt(0).toUpperCase() + key.slice(1)}`);

        if (input) {
            input.value = currentSettings[key];
            updateVal(`val${key.charAt(0).toUpperCase() + key.slice(1)}`, currentSettings[key]);
        }
        if (checkbox) checkbox.checked = currentSettings[key];
        if (select) select.value = currentSettings[key];
    });

    debouncedProcess(true);
    alert('Settings restored!');
};

// Load history from localStorage on startup
try {
    const saved = localStorage.getItem('laserStudioExportHistory');
    if (saved) {
        exportHistory = JSON.parse(saved);
        updateExportHistoryUI();
    }
} catch (e) {
    console.warn('Could not load export history:', e);
}

// =====================================================
// 6. QUALITY METRICS
// =====================================================

const metricsPanel = document.getElementById('metricsPanel');
const metricTime = document.getElementById('metricTime');
const metricSize = document.getElementById('metricSize');
const metricPaths = document.getElementById('metricPaths');

function startMetrics() {
    processingStartTime = performance.now();
    metricsPanel.classList.remove('hidden');
}

function updateMetrics(paths = 0) {
    const elapsed = performance.now() - processingStartTime;
    qualityMetrics.time = elapsed;
    qualityMetrics.paths = paths;

    // Estimate file size based on canvas
    const dataUrl = canvas.toDataURL('image/bmp');
    qualityMetrics.size = Math.round(dataUrl.length * 0.75 / 1024); // Rough estimate in KB

    metricTime.textContent = `${elapsed.toFixed(0)}ms`;
    metricSize.textContent = `~${qualityMetrics.size}KB`;
    metricPaths.textContent = paths > 0 ? paths : 'N/A';
}

// Wrap processImage to add metrics
const originalProcessImageFunc = window.processImage;
window.processImage = function (highQuality = true) {
    startMetrics();
    const result = originalProcessImageFunc.call(this, highQuality);
    updateMetrics(0); // Will be updated by vectorization if applicable
    return result;
};

// =====================================================
// 7. EXPORT TRACKING - TEMPORARILY DISABLED
// =====================================================

// DISABLED: Export tracking was causing freezes
// Will re-enable after confirming original exports work

/*
setTimeout(() => {
    const btnExportBMP = document.getElementById('btnExportBMP');
    const btnExportDXF = document.getElementById('btnExportDXF');
    const btnExportSVG = document.getElementById('btnExportSVG');

    if (btnExportBMP) {
        btnExportBMP.addEventListener('click', () => {
            // Just track history, don't interfere with export
            setTimeout(() => {
                try {
                    addToExportHistory('bmp', currentSettings);
                } catch (e) {
                    console.warn('Could not add to history:', e);
                }
            }, 100);
        });
    }

    if (btnExportDXF) {
        btnExportDXF.addEventListener('click', () => {
            setTimeout(() => {
                try {
                    addToExportHistory('dxf', currentSettings);
                    // Try to count vectors for metrics
                    try {
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const lines = Vectorizer.marchingSquares(imgData.data, canvas.width, canvas.height);
                        updateMetrics(lines.length);
                    } catch (e) {
                        console.warn('Could not count vectors:', e);
                    }
                } catch (e) {
                    console.warn('Could not add to history:', e);
                }
            }, 100);
        });
    }

    if (btnExportSVG) {
        btnExportSVG.addEventListener('click', () => {
            setTimeout(() => {
                try {
                    addToExportHistory('svg', currentSettings);
                    // Try to count vectors for metrics
                    try {
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const lines = Vectorizer.marchingSquares(imgData.data, canvas.width, canvas.height);
                        updateMetrics(lines.length);
                    } catch (e) {
                        console.warn('Could not count vectors:', e);
                    }
                } catch (e) {
                    console.warn('Could not add to history:', e);
                }
            }, 100);
        });
    }

    console.log('✅ Export history tracking initialized');
}, 100);
*/

console.log('⚠️ Export tracking temporarily disabled for debugging');

// =====================================================
// INITIALIZATION
// =====================================================

console.log('🔥 Laser Studio Pro Extensions Loaded!');
console.log('New Features:');
console.log('- 🔍 Comparison Mode');
console.log('- 🔎 Canvas Zoom & Pan');
console.log('- ⌨️  Keyboard Shortcuts');
console.log('- 📦 Batch Processing');
console.log('- 📊 Export History (DISABLED)');
console.log('- 📈 Quality Metrics (DISABLED)');
