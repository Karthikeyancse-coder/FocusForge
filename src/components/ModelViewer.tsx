import React, { Suspense, useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls, Float, Environment, PerspectiveCamera, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, Info } from "lucide-react";

// Error Boundary for capturing loading errors of the GLTF model inside React Three Fiber
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("ModelViewer GLTF Loader failed. Rendering beautiful holographic 3D Cyber-Crystal fallback.", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 1. Particle System component for immersive cyberpunk ambiance
function ParticleSystem({ count = 150 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;     // x
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5; // y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6; // z
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
      pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#2be88c"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 2. Immersive Holographic Cyber-Crystal 3D Fallback Mesh
function CyberCrystalFallback() {
  const crystalRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (crystalRef.current) {
      crystalRef.current.rotation.y = time * 0.35;
      crystalRef.current.rotation.x = time * 0.18;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.x = time * 0.15;
      ringRef1.current.rotation.y = time * 0.25;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y = -time * 0.2;
      ringRef2.current.rotation.z = time * 0.12;
    }
  });

  return (
    <group position={[0, -0.1, 0]}>
      {/* Core Energy Pulse Sphere */}
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} />
      </mesh>

      {/* Floating Crystal solid structure */}
      <mesh ref={crystalRef}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshPhysicalMaterial
          color="#2be88c"
          emissive="#1fa463"
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.9}
          flatShading
        />
      </mesh>

      {/* Interactive Outward Holographic Grid wireframe */}
      <mesh ref={crystalRef}>
        <icosahedronGeometry args={[0.83, 1]} />
        <meshBasicMaterial
          color="#2be88c"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Orbital Ring A */}
      <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.2, 0.015, 16, 80]} />
        <meshBasicMaterial color="#2be88c" transparent opacity={0.4} />
      </mesh>

      {/* Orbital Ring B */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[1.45, 0.012, 16, 80]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// 3. GLTF Character Model Loader component
interface CharacterModelProps {
  url: string;
  onError: () => void;
}

function CharacterModel({ url, onError }: CharacterModelProps) {
  const { scene, animations } = useGLTF(url);
  const clone = React.useMemo(() => scene.clone(), [scene]);
  const { actions } = useAnimations(animations, clone);

  // Auto-play idle animation if available
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const idleActionName = Object.keys(actions).find(
        (key) =>
          key.toLowerCase().includes("idle") ||
          key.toLowerCase().includes("stand") ||
          key.toLowerCase().includes("pose") ||
          key.toLowerCase().includes("loop")
      ) || Object.keys(actions)[0];

      if (idleActionName && actions[idleActionName]) {
        actions[idleActionName].reset().fadeIn(0.5).play();
      }
    }
    return () => {
      if (actions) {
        Object.values(actions).forEach((action) => action?.fadeOut(0.5));
      }
    };
  }, [actions]);

  // Center, normalize and scale the loaded GLTF model automatically
  const boundingBox = React.useMemo(() => {
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetScale = maxDim > 0 ? 3.0 / maxDim : 1;
    return { size, center, targetScale };
  }, [clone]);

  return (
    <primitive
      object={clone}
      position={[
        -boundingBox.center.x * boundingBox.targetScale,
        -boundingBox.center.y * boundingBox.targetScale,
        -boundingBox.center.z * boundingBox.targetScale
      ]}
      scale={[boundingBox.targetScale, boundingBox.targetScale, boundingBox.targetScale]}
    />
  );
}

// 4. Main ModelViewer Component
interface ModelViewerProps {
  modelPath?: string;
  className?: string;
}

export function ModelViewer({ modelPath = "/models/goku_ssj.glb", className = "" }: ModelViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // We can double check if the file is reachable or skip loading GLTF immediately to save network overhead if the model is totally missing
  useEffect(() => {
    const checkFile = async () => {
      try {
        const response = await fetch(modelPath, { method: "GET" }); // GET instead of HEAD to safely verify content type
        const contentType = response.headers.get("content-type") || "";
        
        if (!response.ok || contentType.includes("text/html")) {
          setLoadError(true);
        }
        setIsLoading(false);
      } catch (err) {
        setLoadError(true);
        setIsLoading(false);
      }
    };
    checkFile();
  }, [modelPath]);

  return (
    <div className={`relative w-full h-full min-h-[350px] lg:min-h-[450px] overflow-hidden rounded-[24px] ${className}`}>
      {/* Background Cyberpunk Ambient Glow Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c100e] via-[#0e1612] to-[#120f18] transition-colors duration-500 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--accent-primary)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

      {/* Canvas Layer */}
      <div className="absolute inset-0 z-10">
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          className="w-full h-full"
        >
          {/* Cinematic Camera */}
          <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={45} />

          {/* Core Ambient Lighting */}
          <ambientLight intensity={0.55} />

          {/* Direct Spotlight focused on the character for dramatic shadows */}
          <spotLight
            position={[4, 5, 4]}
            angle={0.35}
            penumbra={0.9}
            intensity={2.5}
            castShadow
            shadow-bias={-0.0001}
          />

          {/* High-Contrast Directional Fill Light */}
          <directionalLight
            position={[-5, 3, -2]}
            intensity={1.2}
            color="#06b6d4" // Cyan fill
          />

          {/* Accent lighting from the bottom to represent glowing ground */}
          <pointLight
            position={[0, -2, 0]}
            intensity={1.8}
            color="#2be88c" // Accent Green glow
          />

          {/* Realistic Reflections */}
          {/* <Environment preset="sunset" /> */ }

          {/* Floating particle ambient animation */}
          <ParticleSystem count={160} />

          {/* Gentle Float effect */}
          <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.35}>
            {isLoading ? (
              <CyberCrystalFallback />
            ) : loadError ? (
              <CyberCrystalFallback />
            ) : (
              <ModelErrorBoundary fallback={<CyberCrystalFallback />}>
                <Suspense fallback={null}>
                  <CharacterModel url={modelPath} onError={() => setLoadError(true)} />
                </Suspense>
              </ModelErrorBoundary>
            )}
          </Float>

          {/* Preload models for faster rendering */}
          <Preload all />

          {/* Interactive Controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.6}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.75}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      {/* Cybernetic HUD Overlay UI details */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-[var(--border-subtle)]/40 px-3 py-1.5 rounded-full text-[10px] text-[var(--text-secondary)] font-mono font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2be88c] animate-pulse" />
          {loadError ? "CORE ENGINE: ACTIVE FALLBACK" : "3D GRAPHICS ENGINE: ACTIVE"}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-[var(--border-subtle)]/40 p-2 rounded-full text-[10px] text-[var(--text-muted)] font-mono flex items-center justify-center gap-1">
          <Info size={11} className="text-[#2be88c]" />
          <span>Drag to Rotate</span>
        </div>
      </div>
    </div>
  );
}
