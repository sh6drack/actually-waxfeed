"use client"

import { Canvas } from "@react-three/fiber"
import { Box } from "@react-three/drei"

export function RecordPlayer3D() {
  return (
    <Canvas className="w-full h-full" camera={{ position: [0, 0, 3], fov: 50 }}>
      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />

      {/* Record player base */}
      <Box args={[2, 0.3, 1.5]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#000000" />
      </Box>

      {/* Turntable (spinning vinyl) */}
      <group position={[0, 0.2, 0]}>
        <Box args={[1.8, 0.05, 1.3]}>
          <meshStandardMaterial color="#ffffff" />
        </Box>
      </group>

      {/* Tonearm */}
      <group position={[-0.6, 0.3, 0]}>
        <Box args={[0.05, 0.8, 0.05]}>
          <meshStandardMaterial color="#000000" />
        </Box>
      </group>
    </Canvas>
  )
}
