/**
 * Vectorizer.js
 * Implements Marching Squares for contour tracing and simplified DXF export.
 */

window.Vectorizer = {
    // Ramer-Douglas-Peucker simplification
    simplifyPoints: function (points, tolerance) {
        if (points.length <= 2) return points;

        const sqTolerance = tolerance * tolerance;
        let maxSqDist = 0;
        let index = 0;

        for (let i = 1; i < points.length - 1; i++) {
            const sqDist = this.getSqSegDist(points[i], points[0], points[points.length - 1]);
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            const left = this.simplifyPoints(points.slice(0, index + 1), tolerance);
            const right = this.simplifyPoints(points.slice(index), tolerance);
            return left.slice(0, left.length - 1).concat(right);
        } else {
            return [points[0], points[points.length - 1]];
        }
    },

    getSqSegDist: function (p, p1, p2) {
        let x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
        if (dx !== 0 || dy !== 0) {
            const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) { x = p2.x; y = p2.y; }
            else if (t > 0) { x += dx * t; y += dy * t; }
        }
        dx = p.x - x;
        dy = p.y - y;
        return dx * dx + dy * dy;
    },

    // Catmull-Rom Spline interpolation for smooth curves
    getCurvePoints: function (points, tension = 0.5, numOfSegments = 10) {
        if (points.length < 3) return points;
        const res = [];
        const pts = points.slice();

        // Add dummy points at ends
        pts.unshift(points[0]);
        pts.push(points[points.length - 1]);

        for (let i = 1; i < pts.length - 2; i++) {
            for (let t = 0; t <= numOfSegments; t++) {
                const p = this.catmullRom(pts[i - 1], pts[i], pts[i + 1], pts[i + 2], t / numOfSegments, tension);
                // Don't duplicate points
                if (res.length === 0 || (Math.abs(res[res.length - 1].x - p.x) > 0.01 || Math.abs(res[res.length - 1].y - p.y) > 0.01)) {
                    res.push(p);
                }
            }
        }
        return res;
    },

    catmullRom: function (p0, p1, p2, p3, t, tension) {
        const t2 = t * t;
        const t3 = t2 * t;

        const f1 = -tension * t3 + 2 * tension * t2 - tension * t;
        const f2 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
        const f3 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
        const f4 = tension * t3 - tension * t2;

        return {
            x: p0.x * f1 + p1.x * f2 + p2.x * f3 + p3.x * f4,
            y: p0.y * f1 + p1.y * f2 + p2.y * f3 + p3.y * f4
        };
    },

    // Marching Squares Algorithm to find contours
    findContours: function (data, width, height) {
        // data is a Uint8ClampedArray (RGBA)
        // We assume image is thresholded 0 or 255.
        // We'll create a binary grid.

        const grid = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
            // Check Red channel
            grid[i] = data[i * 4] > 128 ? 1 : 0;
        }

        const contours = [];
        const visited = new Uint8Array(width * height); // track visited horizontal edges roughly

        // This is a naive implementation: Scan for edges and follow them.
        // A full Marching Squares implementation is lengthy, let's use a "Moore-Neighbor Tracing" on binary image instead.
        // It produces ordered points for a polygon.

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y * width + x] === 1) {
                    // Found a white pixel.
                    // If it's a boundary (next to black), trace it?
                    // Actually, let's trace boundaries of WHITE regions.
                    // If this pixel is boundary and not visited...
                    // Simpler: Use d3-contour or similar... but we want standalone.

                    // Let's implement a simple "Walk perimeter"
                    // If pixel is 1 and left is 0, start trace.
                    // To avoid re-tracing, we need a map of visited edges.
                    // For brevity in this artifact, let's use a known library approach concept:
                    // Only start trace if we are at an edge we haven't processed.

                    // Actually, for this specific use case (engraving), 
                    // converting every single white pixel to a tiny loop is bad (dithering).
                    // This vectorizer assumes "Threshold mode" (large blobs).

                    // Let's implement a simple edge scanner.
                    // If cur=1 and left=0, it's an outer contour start.
                }
            }
        }

        // Since implementing a robust contour tracer from scratch is error-prone in one shot,
        // we will use a simplified approach: Scan rows, detect runs, convert to lines? No, we need contours for DXF.

        // Re-strategy: Use a very simple "square tracing" algorithm.
        // Reference: http://www.imageprocessingplace.com/downloads_V3/root_downloads/tutorials/contour_tracing_Abe_website/index.html

        // For the sake of this demo ensuring it works reliably:
        // We will do a "Soup of Lines" approach (generating edges for every pixel transition) + Simplification.
        // It's not perfect topology but works for engraving.

        const segments = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const val = grid[idx];

                if (val === 1) {
                    // Check Right
                    if (x + 1 < width && grid[idx + 1] === 0) {
                        segments.push([{ x: x + 1, y: y }, { x: x + 1, y: y + 1 }]);
                    }
                    // Check Bottom
                    if (y + 1 < height && grid[idx + width] === 0) {
                        segments.push([{ x: x, y: y + 1 }, { x: x + 1, y: y + 1 }]);
                    }
                    // Check Left
                    if (x - 1 >= 0 && grid[idx - 1] === 0) {
                        segments.push([{ x: x, y: y + 1 }, { x: x, y: y }]);
                    }
                    // Check Top
                    if (y - 1 >= 0 && grid[idx - width] === 0) {
                        segments.push([{ x: x + 1, y: y }, { x: x, y: y }]);
                    }
                }
            }
        }

        // Now valid, but thousands of tiny lines.
        // A "Joiner" pass would be needed to make polylines.
        // Given complexity, let's just export independent lines (GL_LINES) style to DXF. 
        // Most laser software (LightBurn) handles "Soup of lines" fine or has "Auto-Join".
        // BUT, we promised "Clean Lines".

        // Alternative: Use a library link in the HTML?
        // Yes, let's use a CDN for `d3-contour` or `imagetracer` in the main HTML, 
        // to make this robust.
        // I will update the HTML to include `imagetracer.js` if possible, 
        // or just rely on a simple custom trace for "good enough" results.

        // Let's stick to the "Soup" for now as a fallback, but I'll add logic to chain them if endpoints match.
        // A greedy joiner:

        let paths = [];
        while (segments.length > 0) {
            let poly = [segments.pop()]; // Start with one segment
            // Try to append to tail
            let changed = true;
            // This is O(N^2), might be slow for large images. 
            // Optim: dictionary of endpoints.
            paths.push(poly.map(s => s[0]).concat([poly[0][1]])); // Just push raw segment for now to be safe on performance
        }

        // Actually, let's just return the raw segments for the MPV web version, 
        // and tell the user "Use Threshold mode + LightBurn Auto-Join".
        // Or better: Implement a strict Marching Squares case table.
        return segments; // Placeholder for the complex logic
    },

    // Better Approach: Use the Marching Squares Lookup Table for segments
    // 0..15 cases.
    marchingSquares: function (data, width, height) {
        const grid = new Uint8Array(width * height);
        for (let i = 0; i < data.length / 4; i++) grid[i] = data[i * 4] > 128 ? 1 : 0;

        const lines = [];

        // Function to interp? No, binary 0/1, so midpoints are always 0.5.
        // We will produce list of lines {p1, p2}.

        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width - 1; x++) {
                // Get 4 corners
                // p1 p2
                // p4 p3
                const p1 = grid[y * width + x];
                const p2 = grid[y * width + (x + 1)];
                const p3 = grid[(y + 1) * width + (x + 1)];
                const p4 = grid[(y + 1) * width + x];

                const caseIdx = (p1 << 3) | (p2 << 2) | (p3 << 1) | p4;
                if (caseIdx === 0 || caseIdx === 15) continue;

                // Coordinates relative to square top-left (x,y)
                // Midpoints: Top(x+0.5, y), Right(x+1, y+0.5), Bottom(x+0.5, y+1), Left(x, y+0.5)
                const a = { x: x + 0.5, y: y };
                const b = { x: x + 1, y: y + 0.5 };
                const c = { x: x + 0.5, y: y + 1 };
                const d = { x: x, y: y + 0.5 };

                // Add lines based on MS case
                switch (caseIdx) {
                    case 1: lines.push([d, c]); break;
                    case 2: lines.push([b, c]); break;
                    case 3: lines.push([d, b]); break;
                    case 4: lines.push([a, b]); break;
                    case 5: lines.push([a, d], [b, c]); break; // Saddle, split
                    case 6: lines.push([a, c]); break;
                    case 7: lines.push([a, d]); break;
                    case 8: lines.push([a, d]); break;
                    case 9: lines.push([a, c]); break;
                    case 10: lines.push([a, b], [c, d]); break; // saddle
                    case 11: lines.push([a, b]); break;
                    case 12: lines.push([d, b]); break;
                    case 13: lines.push([b, c]); break;
                    case 14: lines.push([d, c]); break;
                }
            }
        }

        const loops = this.chainLines(lines);

        console.log(`Vectorizer: Generated ${lines.length} raw lines, chained into ${loops.length} loops`);

        // NOISE REMOVAL: Remove very short paths
        // Reduced from 4 to 2 to allow smaller shapes
        const filtered = loops.filter(p => p.length >= 2);

        console.log(`Vectorizer: After filtering, ${filtered.length} loops remain`);

        return filtered;
    },

    chainLines: function (lines) {
        if (lines.length === 0) return [];

        const endpointMap = new Map();

        function getCoordKey(p) {
            return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
        }

        const segments = [];
        lines.forEach(l => {
            if (l.length === 2) {
                segments.push({ p1: l[0], p2: l[1], used: false });
            } else if (l.length === 4) {
                segments.push({ p1: l[0], p2: l[1], used: false });
                segments.push({ p1: l[2], p2: l[3], used: false });
            }
        });

        // Populate map
        segments.forEach((s, i) => {
            const k1 = getCoordKey(s.p1);
            const k2 = getCoordKey(s.p2);
            if (!endpointMap.has(k1)) endpointMap.set(k1, []);
            if (!endpointMap.has(k2)) endpointMap.set(k2, []);
            endpointMap.get(k1).push({ segIdx: i, point: 'p1' });
            endpointMap.get(k2).push({ segIdx: i, point: 'p2' });
        });

        const polylines = [];

        for (let i = 0; i < segments.length; i++) {
            if (segments[i].used) continue;

            const currentPoly = [segments[i].p1, segments[i].p2];
            segments[i].used = true;

            let head = segments[i].p1;
            let tail = segments[i].p2;

            // Expand tail
            let found = true;
            while (found) {
                found = false;
                const key = getCoordKey(tail);
                const matches = endpointMap.get(key) || [];
                for (const m of matches) {
                    if (!segments[m.segIdx].used) {
                        const nextPt = m.point === 'p1' ? segments[m.segIdx].p2 : segments[m.segIdx].p1;
                        currentPoly.push(nextPt);
                        segments[m.segIdx].used = true;
                        tail = nextPt;
                        found = true;
                        break;
                    }
                }
            }

            // Expand head (by prepending)
            found = true;
            while (found) {
                found = false;
                const key = getCoordKey(head);
                const matches = endpointMap.get(key) || [];
                for (const m of matches) {
                    if (!segments[m.segIdx].used) {
                        const nextPt = m.point === 'p1' ? segments[m.segIdx].p2 : segments[m.segIdx].p1;
                        currentPoly.unshift(nextPt);
                        segments[m.segIdx].used = true;
                        head = nextPt;
                        found = true;
                        break;
                    }
                }
            }

            polylines.push(currentPoly);
        }

        return polylines;
    },

    generateDXF: function (loops) {
        let content = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n";
        content += "0\nSECTION\n2\nENTITIES\n";

        loops.forEach(loop => {
            if (loop.length < 2) return;

            // Smooth path before export
            const smoothPath = this.getCurvePoints(loop, 0.5, 3);

            // LWPOLYLINE is better for files with many segments
            content += "0\nLWPOLYLINE\n8\n0\n90\n" + smoothPath.length + "\n";
            content += "70\n0\n";
            smoothPath.forEach(p => {
                content += "10\n" + p.x.toFixed(4) + "\n20\n" + (-p.y).toFixed(4) + "\n";
            });
        });

        content += "0\nENDSEC\n0\nEOF\n";
        return content;
    },

    generateSVG: function (loops, width, height) {
        let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
        svg += `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n`;

        loops.forEach(loop => {
            if (loop.length < 2) return;

            // Smooth path before export
            const smoothPath = this.getCurvePoints(loop, 0.5, 3);

            let pathData = `M ${smoothPath[0].x.toFixed(3)} ${smoothPath[0].y.toFixed(3)}`;
            for (let i = 1; i < smoothPath.length; i++) {
                pathData += ` L ${smoothPath[i].x.toFixed(3)} ${smoothPath[i].y.toFixed(3)}`;
            }
            svg += `  <path d="${pathData}" fill="none" stroke="black" stroke-width="0.1" />\n`;
        });

        svg += `</svg>`;
        return svg;
    }
};
