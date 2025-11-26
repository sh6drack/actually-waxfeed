"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function IridescentVinylWithTonearm() {
  const vinylRef = useRef<THREE.Group>(null)
  const outerRingRef = useRef<THREE.Mesh>(null)
  const grooveRefs = useRef<THREE.Mesh[]>([])
  const centerRef = useRef<THREE.Mesh>(null)

  // Subtle UV iridescent colors - purple/blue/violet shifting
  const uvColors = useMemo(() => [
    new THREE.Color("#9b7bbd"), // soft violet
    new THREE.Color("#7b9abd"), // blue-violet
    new THREE.Color("#8b6bcd"), // medium purple
    new THREE.Color("#6b8bbd"), // steel blue
    new THREE.Color("#ab7bcd"), // orchid
  ], [])

  useFrame((state, delta) => {
    if (vinylRef.current) {
      vinylRef.current.rotation.z += delta * 0.5
    }

    // Subtle color shifting for iridescent effect
    const time = state.clock.elapsedTime
    const colorShift = Math.sin(time * 0.3) * 0.5 + 0.5

    if (outerRingRef.current) {
      const mat = outerRingRef.current.material as THREE.MeshStandardMaterial
      mat.color.lerpColors(uvColors[0], uvColors[1], colorShift)
    }

    grooveRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        const offset = (time * 0.2 + i * 0.5) % 1
        mat.color.lerpColors(uvColors[i % uvColors.length], uvColors[(i + 1) % uvColors.length], offset)
      }
    })

    if (centerRef.current) {
      const mat = centerRef.current.material as THREE.MeshStandardMaterial
      mat.color.lerpColors(uvColors[2], uvColors[4], colorShift)
    }
  })

  return (
    <>
      {/* Spinning vinyl group */}
      <group ref={vinylRef}>
        {/* Iridescent outer ring */}
        <mesh ref={outerRingRef}>
          <torusGeometry args={[1.35, 0.08, 16, 64]} />
          <meshStandardMaterial
            color="#9b7bbd"
            metalness={1}
            roughness={0.15}
          />
        </mesh>

        {/* Iridescent grooves */}
        {[0.4, 0.6, 0.8, 1.0, 1.2].map((radius, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) grooveRefs.current[i] = el }}
          >
            <torusGeometry args={[radius, 0.02, 8, 64]} />
            <meshStandardMaterial
              color={uvColors[i % uvColors.length]}
              metalness={1}
              roughness={0.1}
            />
          </mesh>
        ))}

        {/* Iridescent center label */}
        <mesh ref={centerRef} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.04, 32]} />
          <meshStandardMaterial
            color="#c0b0e0"
            metalness={1}
            roughness={0.1}
          />
        </mesh>

        {/* Center hole */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
          <meshStandardMaterial color="#2a2a3a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Tonearm - doesn't spin, subtle UV tint */}
      <group position={[0.9, 0.1, -0.6]} rotation={[0, -0.4, 0]}>
        {/* Tonearm base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
          <meshStandardMaterial color="#8080a0" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Tonearm horizontal */}
        <mesh position={[-0.6, 0.05, 0.4]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[1.2, 0.04, 0.04]} />
          <meshStandardMaterial color="#a0a0c0" metalness={1} roughness={0} />
        </mesh>

        {/* Cartridge/needle at end */}
        <mesh position={[-1.1, 0.02, 0.7]}>
          <boxGeometry args={[0.15, 0.06, 0.08]} />
          <meshStandardMaterial color="#606080" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </>
  )
}

export function RecordPlayer3D() {
  return (
    <Canvas
      style={{ width: "100%", height: "100%" }}
      camera={{ position: [0, 5, 0], fov: 25 }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Transparent background */}
      <color attach="background" args={["transparent"]} />

      {/* Lighting for chrome effect */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={2} color="#ffffff" />
      <directionalLight position={[-5, 8, -5]} intensity={1} color="#ffffff" />
      <pointLight position={[0, 5, 0]} intensity={1.5} color="#ffffff" />
      <spotLight
        position={[2, 6, 2]}
        angle={0.4}
        penumbra={1}
        intensity={3}
        color="#ffffff"
      />

      <IridescentVinylWithTonearm />
    </Canvas>
  )
}
