
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

// Mock THREE to avoid issues in test environment if necessary, 
// though JSdom should handle basic THREE objects.
// For STLExporter, we might need to rely on the actual implementation if available,
// or mock it if it relies on browser specifics not in JSDOM.

describe('STLExporter', () => {
    it('should export a simple mesh to STL string', () => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);

        const exporter = new STLExporter();
        const result = exporter.parse(mesh);

        expect(typeof result).toBe('string');
        expect(result).toContain('solid');
        expect(result).toContain('facet normal');
        expect(result).toContain('endsolid');
    });
});
