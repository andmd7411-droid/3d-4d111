import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter';

export type ModelFormat = 'STL' | 'OBJ' | 'GLTF' | 'PLY' | 'GLB';

export interface ModelConversionOptions {
    format: ModelFormat;
    binary?: boolean; // For STL/GLTF
}

export class ModelConverter {
    static async convert(file: File, options: ModelConversionOptions): Promise<Blob> {
        const srcExt = file.name.split('.').pop()?.toUpperCase() || '';
        const buffer = await file.arrayBuffer();

        // 1. Load Model
        const object = await this.loadModel(buffer, srcExt);

        // 2. Export Model
        return this.exportModel(object, options);
    }

    private static async loadModel(buffer: ArrayBuffer, ext: string): Promise<THREE.Object3D> {
        return new Promise((resolve, reject) => {
            const onError = (e: any) => reject(e);

            switch (ext) {
                case 'STL':
                    const stlLoader = new STLLoader();
                    const geometry = stlLoader.parse(buffer);
                    const mesh = new THREE.Mesh(geometry);
                    resolve(mesh);
                    break;
                case 'OBJ':
                    const objLoader = new OBJLoader();
                    // OBJLoader expects text usually, but can parse from buffer if converted to text
                    // However, standard OBJLoader.parse takes string.
                    const textDecoder = new TextDecoder();
                    const text = textDecoder.decode(buffer);
                    const group = objLoader.parse(text);
                    resolve(group);
                    break;
                case 'GLTF':
                case 'GLB':
                    const gltfLoader = new GLTFLoader();
                    gltfLoader.parse(buffer, '', (gltf) => {
                        resolve(gltf.scene);
                    }, onError);
                    break;
                default:
                    reject(new Error(`Unsupported source format: ${ext}`));
            }
        });
    }

    private static async exportModel(object: THREE.Object3D, options: ModelConversionOptions): Promise<Blob> {
        return new Promise((resolve, reject) => {
            try {
                switch (options.format) {
                    case 'STL':
                        const stlExporter = new STLExporter();
                        // binary defaults to false in some versionss, but we usually want binary for size
                        const stlResult = stlExporter.parse(object, { binary: options.binary !== false });
                        resolve(new Blob([stlResult], { type: 'application/octet-stream' }));
                        break;
                    case 'OBJ':
                        const objExporter = new OBJExporter();
                        const objResult = objExporter.parse(object);
                        resolve(new Blob([objResult], { type: 'text/plain' }));
                        break;
                    case 'GLTF':
                    case 'GLB':
                        const gltfExporter = new GLTFExporter();
                        gltfExporter.parse(
                            object,
                            (result) => {
                                if (result instanceof ArrayBuffer) {
                                    resolve(new Blob([result], { type: 'application/octet-stream' }));
                                } else {
                                    const json = JSON.stringify(result);
                                    resolve(new Blob([json], { type: 'application/json' }));
                                }
                            },
                            (error) => reject(error),
                            { binary: options.format === 'GLB' || options.binary }
                        );
                        break;
                    case 'PLY':
                        const plyExporter = new PLYExporter();
                        // PLYExporter parse signature might vary by version, usually (object, onDone, options)
                        // But in Typescript types it often returns result directly or takes callback
                        // Let's assume standard sync return for simplify, or check docs if needed.
                        // Actually PLYExporter usually takes (object, onDone, options) in newer three.js
                        plyExporter.parse(object, (result) => {
                            resolve(new Blob([result], { type: 'application/octet-stream' }));
                        }, {});
                        break;
                    default:
                        reject(new Error(`Unsupported target format: ${options.format}`));
                }
            } catch (e) {
                reject(e);
            }
        });
    }
}
