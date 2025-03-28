
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { useSuitcase } from '@/context/SuitcaseContext';
import { cn } from '@/lib/utils';
import { logError } from '@/utils/errorLogger';
import { Group, Mesh, MeshStandardMaterial } from 'three';

// Try different model sources to ensure compatibility
const SUITCASE_MODEL_URL = 'https://cdn.jsdelivr.net/gh/Dr31K0/3DSuitcase@main/model.glb';
// Fallback URL if needed
const FALLBACK_MODEL_URL = 'https://raw.githubusercontent.com/Dr31K0/3DSuitcase/main/model.glb';

interface SuitcaseModelProps {
  className?: string;
}

const Model = () => {
  const { color } = useSuitcase();
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  
  // Fix the useGLTF call to properly handle errors - using true for onError to silence warnings
  const { scene, nodes } = useGLTF(SUITCASE_MODEL_URL, undefined, true);
  
  // Add manual error handler
  useEffect(() => {
    const handleModelError = (e: ErrorEvent) => {
      if (e.message && e.message.includes('GLB')) {
        console.error("Error loading model:", e);
        setError("Failed to load 3D model: " + e.message);
      }
    };
    
    window.addEventListener('error', handleModelError);
    return () => window.removeEventListener('error', handleModelError);
  }, []);
  
  const modelRef = useRef<Group>(null);
  
  // Map selected color to material color with increased brightness
  const getColorValue = () => {
    switch (color) {
      case 'purple':
        return '#B794F6'; // Lighter crystal-purple
      case 'blue':
        return '#7AB7FF'; // Lighter crystal-blue
      case 'orange':
        return '#FFAC74'; // Lighter crystal-orange
      default:
        return '#B794F6'; // default to lighter crystal-purple
    }
  };
  
  // Apply color to the model and log model structure to debug
  useEffect(() => {
    try {
      if (scene) {
        console.log('Model loaded successfully:', scene);
        
        scene.traverse((node) => {
          if ((node as Mesh).isMesh) {
            const mesh = node as Mesh;
            console.log('Found mesh:', mesh.name);
            
            // Apply material color to all meshes with increased emissive for brightness
            if (mesh.material) {
              if (mesh.material instanceof MeshStandardMaterial) {
                // Set base color
                mesh.material.color.set(getColorValue());
                // Add subtle emissive glow to brighten
                mesh.material.emissive.set(getColorValue());
                mesh.material.emissiveIntensity = 0.2;
                // Increase reflectivity for a more vibrant look
                mesh.material.metalness = 0.4;
                mesh.material.roughness = 0.3;
                mesh.material.needsUpdate = true;
                console.log('Applied brightened color to:', mesh.name);
              } else {
                console.log('Material is not MeshStandardMaterial:', mesh.material);
              }
            } else {
              console.log('Mesh has no material:', mesh.name);
            }
          }
        });
        
        setLoaded(true);
      } else {
        console.warn('Scene is undefined');
      }
    } catch (e) {
      const error = e as Error;
      console.error('Error in model effect:', error);
      setError(error.message);
      logError(error, 'SuitcaseModel:ApplyColor');
    }
  }, [scene, color]);
  
  // Add subtle animation
  useFrame((state) => {
    if (modelRef.current) {
      const t = state.clock.getElapsedTime();
      modelRef.current.rotation.y = Math.sin(t / 4) * 0.1;
    }
  });
  
  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 0.6, 0.2]} />
        <meshStandardMaterial color="red" />
        <Html position={[0, 1, 0]}>
          <div style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
            Error loading model: {error}
          </div>
        </Html>
      </mesh>
    );
  }
  
  // Modified position by adjusting the Y value to move the model up
  return <primitive ref={modelRef} object={scene} scale={1.5} position={[0, -0.1, 0]} />;
};

// Fallback component to show while loading with brighter colors
const ModelFallback = () => {
  const { color } = useSuitcase();
  
  // Get brighter color value based on selection
  const getColorValue = () => {
    switch (color) {
      case 'purple':
        return '#B794F6';
      case 'blue':
        return '#7AB7FF';
      case 'orange':
        return '#FFAC74';
      default:
        return '#B794F6';
    }
  };
  
  console.log("Showing fallback model");
  
  return (
    <mesh>
      <boxGeometry args={[1, 0.6, 0.2]} />
      <meshStandardMaterial color={getColorValue()} emissive={getColorValue()} emissiveIntensity={0.2} />
    </mesh>
  );
};

// Add Html component for debugging
const Html = ({ children, position }: { children: React.ReactNode, position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[0.1, 0.1]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <div className="html-content" style={{
        position: 'absolute',
        fontSize: '12px',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }}>
        {children}
      </div>
    </group>
  );
};

const SuitcaseModel: React.FC<SuitcaseModelProps> = ({ className }) => {
  const [canvasError, setCanvasError] = useState<string | null>(null);
  
  // Fix the handler to properly accept React synthetic events without type error
  const handleCanvasCreationError = (error: any) => {
    console.error("Canvas creation error:", error);
    if (error instanceof Error) {
      setCanvasError(error.message);
      logError(error, 'SuitcaseModel:CanvasCreation');
    } else {
      setCanvasError("Unknown canvas error occurred");
      logError(new Error("Unknown canvas error"), 'SuitcaseModel:CanvasCreation');
    }
  };
  
  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        console.error("WebGL not supported");
        setCanvasError("WebGL not supported by your browser. Please try a different browser or enable hardware acceleration.");
      } else {
        console.log("WebGL is supported");
      }
    } catch (e) {
      console.error("Error checking WebGL support:", e);
    }
    
    return () => {
      // Clean up any resources or listeners
    };
  }, []);
  
  if (canvasError) {
    return (
      <div className={cn(
        'relative w-full h-[500px] rounded-xl overflow-hidden bg-crystal-light/30 flex items-center justify-center',
        className
      )}>
        <div className="p-4 bg-red-500/10 rounded-lg text-red-600 max-w-md text-center">
          <h3 className="font-bold mb-2">3D Rendering Error</h3>
          <p>{canvasError}</p>
          <p className="mt-2 text-sm">
            Try using a modern browser like Chrome, Firefox, or Edge with hardware acceleration enabled.
          </p>
        </div>
      </div>
    );
  }
  
  console.log("Rendering SuitcaseModel component");
  
  return (
    <div 
      className={cn(
        'relative w-full h-[500px] rounded-xl overflow-hidden bg-crystal-light/30',
        className
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        shadows
        onCreated={(state) => {
          console.log("Canvas created successfully", state);
        }}
        onError={handleCanvasCreationError}
      >
        {/* Enhanced lighting setup for better brightness */}
        <ambientLight intensity={2.0} />
        <spotLight 
          position={[10, 10, 10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={3.5} 
          castShadow 
          shadow-mapSize={1024}
        />
        <spotLight 
          position={[-10, 5, -10]} 
          angle={0.15} 
          penumbra={1} 
          intensity={2.5} 
          castShadow 
        />
        <pointLight position={[0, 5, 0]} intensity={2.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={2.5}
          castShadow
          shadow-mapSize={1024}
        />
        {/* Add a fill light from below to eliminate dark shadows */}
        <directionalLight
          position={[0, -3, 0]}
          intensity={1.0}
          castShadow={false}
        />
        
        <Suspense fallback={<ModelFallback />}>
          <group position={[0, 0, 0]}>
            {/* Center-positioned Model */}
            <Model />
            
            {/* Contact shadow beneath the model - adjusted upward and lighter */}
            <ContactShadows
              position={[0, -1.0, 0]}
              opacity={0.6}
              scale={10}
              blur={3}
              far={4}
              resolution={512}
              color="#555"
            />
          </group>
          {/* Fixed: Removed 'intensity' prop from Environment component */}
          <Environment preset="city" />
        </Suspense>
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={7}
          target={[0, 0, 0]}
        />
      </Canvas>
      
      {/* Instruction */}
      <div className="absolute bottom-4 right-4 bg-black/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default SuitcaseModel;

// Fix preload error handling
try {
  console.log("Attempting to preload model:", SUITCASE_MODEL_URL);
  useGLTF.preload(SUITCASE_MODEL_URL);
} catch (error) {
  console.error("Failed to preload model:", error);
  // Try loading with the fallback URL
  try {
    console.log("Attempting to preload fallback model:", FALLBACK_MODEL_URL);
    useGLTF.preload(FALLBACK_MODEL_URL);
  } catch (fallbackError) {
    console.error("Failed to preload fallback model:", fallbackError);
  }
}
