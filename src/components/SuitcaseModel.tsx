
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, SpotLight, useHelper } from '@react-three/drei';
import { useSuitcase } from '@/context/SuitcaseContext';
import { cn } from '@/lib/utils';
import { logError } from '@/utils/errorLogger';
import { Group, Mesh, MeshStandardMaterial, MeshPhysicalMaterial, Color, SpotLightHelper, PointLight } from 'three';

const SUITCASE_MODEL_URL = 'https://cdn.jsdelivr.net/gh/Dr31K0/3DSuitcase@main/model.glb';
const FALLBACK_MODEL_URL = 'https://raw.githubusercontent.com/Dr31K0/3DSuitcase/main/model.glb';

interface SuitcaseModelProps {
  className?: string;
}

const SuitcaseLights = () => {
  const spotLightRef = useRef();
  // useHelper(spotLightRef, SpotLightHelper, 'white'); // Uncomment for debugging

  return (
    <>
      {/* Key light - main light source */}
      <spotLight
        ref={spotLightRef}
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={30}
        castShadow
        shadow-mapSize={1024}
      />

      {/* Fill light - softer light from opposite side */}
      <spotLight 
        position={[-5, 3, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={20} 
        castShadow={false}
      />

      {/* Rim light - from behind to create outline */}
      <spotLight
        position={[0, 2, -5]}
        angle={0.5}
        penumbra={1}
        intensity={15}
        castShadow={false}
      />

      {/* Bottom light for fill */}
      <pointLight position={[0, -3, 0]} intensity={10} />

      {/* Colored lights */}
      <pointLight position={[3, 0, 3]} intensity={10} color="#b28aff" />
      <pointLight position={[-3, 0, -3]} intensity={10} color="#b28aff" />
    </>
  );
};

const Model = () => {
  const { color } = useSuitcase();
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  
  const { scene, nodes } = useGLTF(SUITCASE_MODEL_URL, undefined, true);
  
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
  
  const getColorValue = () => {
    switch (color) {
      case 'purple':
        return '#9b87f5';
      case 'blue':
        return '#7AB7FF';
      case 'orange':
        return '#FFAC74';
      default:
        return '#9b87f5';
    }
  };
  
  const getMetallicProperties = () => {
    switch (color) {
      case 'purple':
        return {
          color: '#9b87f5',
          emissive: '#6E59A5',
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 1.0,
          envMapIntensity: 1.0,
          emissiveIntensity: 0.5,
        };
      case 'blue':
        return {
          color: '#7AB7FF',
          emissive: '#4A7EAB',
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 1.0,
          envMapIntensity: 1.0,
          emissiveIntensity: 0.5,
        };
      case 'orange':
        return {
          color: '#FFAC74',
          emissive: '#D98246',
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 1.0,
          envMapIntensity: 1.0,
          emissiveIntensity: 0.5,
        };
      default:
        return {
          color: '#9b87f5',
          emissive: '#6E59A5',
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 1.0,
          envMapIntensity: 1.0,
          emissiveIntensity: 0.5,
        };
    }
  };
  
  useEffect(() => {
    try {
      if (scene) {
        console.log('Model loaded successfully:', scene);
        
        const properties = getMetallicProperties();
        const colorObj = new Color(properties.color);
        
        scene.traverse((node) => {
          if ((node as Mesh).isMesh) {
            const mesh = node as Mesh;
            console.log('Found mesh:', mesh.name);
            
            if (mesh.material) {
              const physicalMaterial = new MeshPhysicalMaterial({
                color: properties.color,
                emissive: properties.emissive,
                emissiveIntensity: properties.emissiveIntensity,
                metalness: properties.metalness,
                roughness: properties.roughness,
                clearcoat: properties.clearcoat,
                clearcoatRoughness: properties.clearcoatRoughness,
                reflectivity: properties.reflectivity,
                envMapIntensity: properties.envMapIntensity,
              });
              
              // If old material had maps, preserve them
              if (mesh.material instanceof MeshStandardMaterial) {
                const oldMaterial = mesh.material;
                physicalMaterial.map = oldMaterial.map;
                physicalMaterial.normalMap = oldMaterial.normalMap;
                physicalMaterial.aoMap = oldMaterial.aoMap;
              }
              
              mesh.material = physicalMaterial;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              console.log('Applied metallic material to:', mesh.name, 'with color:', properties.color);
            } else {
              console.log('Mesh has no material:', mesh.name);
              mesh.material = new MeshPhysicalMaterial({
                color: properties.color,
                emissive: properties.emissive,
                emissiveIntensity: properties.emissiveIntensity,
                metalness: properties.metalness,
                roughness: properties.roughness,
              });
              mesh.castShadow = true;
              mesh.receiveShadow = true;
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
  
  return <primitive ref={modelRef} object={scene} scale={2.0} position={[0, 0, 0]} />;
};

const ModelFallback = () => {
  const { color } = useSuitcase();
  
  const getMetallicProperties = () => {
    switch (color) {
      case 'purple':
        return {
          color: '#9b87f5',
          emissive: '#6E59A5',
        };
      case 'blue':
        return {
          color: '#7AB7FF',
          emissive: '#4A7EAB',
        };
      case 'orange':
        return {
          color: '#FFAC74',
          emissive: '#D98246',
        };
      default:
        return {
          color: '#9b87f5',
          emissive: '#6E59A5',
        };
    }
  };
  
  const properties = getMetallicProperties();
  console.log("Showing fallback model");
  
  return (
    <mesh>
      <boxGeometry args={[1, 0.6, 0.2]} />
      <meshPhysicalMaterial 
        color={properties.color} 
        emissive={properties.emissive} 
        emissiveIntensity={0.3}
        metalness={0.9}
        roughness={0.15}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        reflectivity={1.0}
      />
    </mesh>
  );
};

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
        'relative w-full h-[500px] rounded-xl overflow-hidden bg-white',
        className
      )}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        shadows
        onCreated={(state) => {
          console.log("Canvas created successfully", state);
        }}
        onError={handleCanvasCreationError}
      >
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={5.0} />
        
        {/* Add the dedicated lights component for better organization */}
        <SuitcaseLights />
        
        <Suspense fallback={<ModelFallback />}>
          <group position={[0, 0, 0]}>
            <Model />
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
          <Environment preset="city" />
        </Suspense>
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minDistance={2}
          maxDistance={5}
          target={[0, 0, 0]}
        />
      </Canvas>
      
      <div className="absolute bottom-4 right-4 bg-black/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default SuitcaseModel;

try {
  console.log("Attempting to preload model:", SUITCASE_MODEL_URL);
  useGLTF.preload(SUITCASE_MODEL_URL);
} catch (error) {
  console.error("Failed to preload model:", error);
  try {
    console.log("Attempting to preload fallback model:", FALLBACK_MODEL_URL);
    useGLTF.preload(FALLBACK_MODEL_URL);
  } catch (fallbackError) {
    console.error("Failed to preload fallback model:", fallbackError);
  }
}
