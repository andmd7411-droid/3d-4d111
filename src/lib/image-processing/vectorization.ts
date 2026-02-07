/**
 * Vectorization Library - SIMPLIFIED VERSION
 * Fast edge-to-vector conversion without complex tracing
 */

export interface Point {
    x: number
    y: number
}

export interface Contour {
    points: Point[]
    closed: boolean
}

/**
 * Simple and fast: convert edge pixels directly to line segments
 */
export function traceContours(edges: boolean[][], minLength: number = 2): Contour[] {
    const height = edges.length
    const width = edges[0]?.length || 0
    const contours: Contour[] = []

    // Simple approach: scan horizontally and vertically for edge runs
    // Horizontal runs
    for (let y = 0; y < height; y++) {
        let startX = -1
        for (let x = 0; x < width; x++) {
            if (edges[y]?.[x]) {
                if (startX === -1) startX = x
            } else if (startX !== -1) {
                if (x - startX >= minLength) {
                    contours.push({
                        points: [{ x: startX, y }, { x: x - 1, y }],
                        closed: false
                    })
                }
                startX = -1
            }
        }
        if (startX !== -1 && width - startX >= minLength) {
            contours.push({
                points: [{ x: startX, y }, { x: width - 1, y }],
                closed: false
            })
        }
    }

    // Vertical runs
    for (let x = 0; x < width; x++) {
        let startY = -1
        for (let y = 0; y < height; y++) {
            if (edges[y]?.[x]) {
                if (startY === -1) startY = y
            } else if (startY !== -1) {
                if (y - startY >= minLength) {
                    contours.push({
                        points: [{ x, y: startY }, { x, y: y - 1 }],
                        closed: false
                    })
                }
                startY = -1
            }
        }
        if (startY !== -1 && height - startY >= minLength) {
            contours.push({
                points: [{ x, y: startY }, { x, y: height - 1 }],
                closed: false
            })
        }
    }

    return contours
}

/**
 * Simplify path using Douglas-Peucker algorithm
 */
export function simplifyPath(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points

    const first = points[0]
    const last = points[points.length - 1]

    // Find the point with maximum distance from line
    let maxDist = 0
    let maxIndex = 0

    for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDistance(points[i], first, last)
        if (dist > maxDist) {
            maxDist = dist
            maxIndex = i
        }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDist > tolerance) {
        const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance)
        const right = simplifyPath(points.slice(maxIndex), tolerance)
        return [...left.slice(0, -1), ...right]
    } else {
        return [first, last]
    }
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y

    if (dx === 0 && dy === 0) {
        return Math.sqrt(
            Math.pow(point.x - lineStart.x, 2) +
            Math.pow(point.y - lineStart.y, 2)
        )
    }

    const num = Math.abs(
        dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
    )
    const den = Math.sqrt(dx * dx + dy * dy)

    return num / den
}

/**
 * Convert contours to SVG path string
 */
export function contoursToSVG(contours: Contour[], width: number, height: number, smoothness: number = 0): string {
    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">\n`
    svg += `  <rect width="100%" height="100%" fill="#1a1a1a"/>\n`

    for (const contour of contours) {
        if (contour.points.length < 2) continue

        const p1 = contour.points[0]
        const p2 = contour.points[contour.points.length - 1]

        svg += `  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="white" stroke-width="1"/>\n`
    }

    svg += '</svg>'
    return svg
}

/**
 * Convert contours to DXF format
 */
export function contoursToDXF(contours: Contour[], width: number, height: number, smoothness: number = 0): string {
    let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
`

    for (const contour of contours) {
        if (contour.points.length < 2) continue

        const p1 = contour.points[0]
        const p2 = contour.points[contour.points.length - 1]

        dxf += `0
LINE
8
0
10
${p1.x}
20
${height - p1.y}
30
0.0
11
${p2.x}
21
${height - p2.y}
31
0.0
`
    }

    dxf += `0
ENDSEC
0
EOF
`

    return dxf
}
