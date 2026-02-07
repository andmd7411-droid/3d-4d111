'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface Scene3DProps {
    meshData: {
        vertices: Float32Array
        indices: Uint32Array
        normals?: Float32Array
    }
    wireframe?: boolean
    autoRotate?: boolean
    lightIntensity?: number
}

export default function Scene3D({ meshData, wireframe = false, autoRotate = false, lightIntensity = 1.0 }: Scene3DProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const meshRef = useRef<THREE.Mesh | null>(null)
    const lightsRef = useRef<THREE.Light[]>([])
    const controlsRef = useRef<OrbitControls | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        // Scene setup
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a0a)
        sceneRef.current = scene

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        )
        camera.position.z = 100

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        renderer.setPixelRatio(window.devicePixelRatio)
        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.autoRotate = autoRotate
        controls.autoRotateSpeed = 2.0
        controlsRef.current = controls

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6 * lightIntensity)
        scene.add(ambientLight)

        const directionalLight1 = new THREE.DirectionalLight(0x0066ff, 0.8 * lightIntensity)
        directionalLight1.position.set(5, 5, 5)
        scene.add(directionalLight1)

        const directionalLight2 = new THREE.DirectionalLight(0x9933ff, 0.6 * lightIntensity)
        directionalLight2.position.set(-5, -5, -5)
        scene.add(directionalLight2)

        lightsRef.current = [ambientLight, directionalLight1, directionalLight2]

        // Grid helper
        const gridHelper = new THREE.GridHelper(200, 20, 0x0066ff, 0x333333)
        scene.add(gridHelper)

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        // Handle resize
        const handleResize = () => {
            if (!containerRef.current) return
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            renderer.dispose()
            containerRef.current?.removeChild(renderer.domElement)
        }
    }, [])

    // Update mesh when meshData changes
    useEffect(() => {
        if (!sceneRef.current || !meshData) return

        // Remove old mesh
        if (meshRef.current) {
            sceneRef.current.remove(meshRef.current)
            meshRef.current.geometry.dispose()
            if (Array.isArray(meshRef.current.material)) {
                meshRef.current.material.forEach(m => m.dispose())
            } else {
                meshRef.current.material.dispose()
            }
        }

        // Create new geometry
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(meshData.vertices, 3))
        geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1))

        if (meshData.normals) {
            geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3))
        } else {
            geometry.computeVertexNormals()
        }

        // Create material with gradient colors
        const material = new THREE.MeshStandardMaterial({
            color: 0x6699ff,
            metalness: 0.3,
            roughness: 0.4,
            flatShading: false,
            wireframe: wireframe
        })

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material)
        meshRef.current = mesh
        sceneRef.current.add(mesh)

        // Center the mesh
        geometry.computeBoundingBox()
        const center = new THREE.Vector3()
        geometry.boundingBox?.getCenter(center)
        mesh.position.sub(center)

    }, [meshData, wireframe])

    // Update controls when autoRotate changes
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = autoRotate
        }
    }, [autoRotate])

    // Update lights when intensity changes
    useEffect(() => {
        if (lightsRef.current.length > 0) {
            lightsRef.current[0].intensity = 0.6 * lightIntensity
            lightsRef.current[1].intensity = 0.8 * lightIntensity
            lightsRef.current[2].intensity = 0.6 * lightIntensity
        }
    }, [lightIntensity])

    return <div ref={containerRef} className="w-full h-full" />
}
