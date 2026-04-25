import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Camera, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

import * as THREE from 'three';

// --- 3D Shirt Component ---
// This takes the 2D product image and wraps it into a 3D half-cylinder
// so it reacts to 3D rotation in real-time like a Snapchat filter!
function Shirt3D({ imageUrl, poseRef }) {
  // We use useMemo or handle potential missing textures gracefully
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          setTexture(tex);
        },
        undefined,
        (err) => console.error("Texture load error", err)
      );
    }
  }, [imageUrl]);

  const meshRef = useRef(null);

  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const scaleVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!meshRef.current || !poseRef.current) return;
    
    const pose = poseRef.current;
    
    // Smooth interpolation (lerp) for 3D realism
    position.set(pose.x, pose.y, pose.z);
    meshRef.current.position.lerp(position, 0.3);
    
    // Create a target quaternion from Euler angles
    euler.set(pose.pitch, pose.yaw, pose.roll);
    quaternion.setFromEuler(euler);
    
    // Smoothly rotate the 3D shirt
    meshRef.current.quaternion.slerp(quaternion, 0.2);
    
    // Smooth scaling
    scaleVec.set(pose.scale, pose.scale * 1.2, pose.scale);
    meshRef.current.scale.lerp(scaleVec, 0.2);
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef}>
      {/* A half-cylinder (Math.PI) to simulate the front curve of a shirt */}
      <cylinderGeometry args={[1, 1, 2, 32, 1, true, -Math.PI / 2, Math.PI]} />
      <meshStandardMaterial 
        map={texture} 
        transparent={true} 
        alphaTest={0.1}
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}


// --- Main AR Component ---
export default function ThreeArCamera({ selectedProduct, onSnap }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Used to draw the video feed behind the 3D scene
  
  const [status, setStatus] = useState('cam-loading'); // cam-loading, model-loading, ready, error
  const [errorMsg, setErrorMsg] = useState('');
  
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  
  // This ref holds the real-time 3D coordinates for the Three.js canvas
  const poseRef = useRef({ x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0, scale: 1 });

  // 1. Initialize Webcam
  useEffect(() => {
    let stream = null;
    const initCam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setStatus('model-loading');
          };
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg('Camera blocked or unavailable.');
      }
    };
    initCam();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  // 2. Initialize BlazePose (3D capable AI)
  useEffect(() => {
    if (status !== 'model-loading') return;
    
    let isCancelled = false;
    const initAI = async () => {
      try {
        await tf.setBackend('webgl');
        await tf.ready(); // Ensure backend is fully initialized
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.BlazePose,
          { runtime: 'tfjs', modelType: 'lite' }
        );
        if (isCancelled) return;
        detectorRef.current = detector;
        setStatus('ready');
      } catch (err) {
        console.error("AI Error:", err);
        if (!isCancelled) {
          setStatus('error');
          setErrorMsg('Failed to load 3D tracking engine.');
        }
      }
    };
    initAI();
    return () => { isCancelled = true; };
  }, [status]);

  // 3. Render Loop (Video to Canvas & Pose Tracking)
  useEffect(() => {
    if (status !== 'ready') return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    let lastVideoTime = -1;

    const render = async () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        
        // Draw video mirrored
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();

        // Run AI Tracking
        if (video.currentTime !== lastVideoTime && detectorRef.current) {
          lastVideoTime = video.currentTime;
          
          try {
            // Predict poses
            const poses = await detectorRef.current.estimatePoses(canvas, { flipHorizontal: false });
            
            if (poses.length > 0 && poses[0].keypoints3D) {
              const kps = poses[0].keypoints;
              const kps3D = poses[0].keypoints3D; // Normalized 3D space (-1 to 1)
              
              const ls = kps.find(k => k.name === 'left_shoulder');
              const rs = kps.find(k => k.name === 'right_shoulder');
              const ls3D = kps3D.find(k => k.name === 'left_shoulder');
              const rs3D = kps3D.find(k => k.name === 'right_shoulder');

              if (ls && rs && ls.score > 0.5 && rs.score > 0.5) {
                // Calculate 2D position in WebGL Space (-1 to 1)
                const cx2D = (ls.x + rs.x) / 2;
                const cy2D = (ls.y + rs.y) / 2;
                
                // Convert pixel coords to Three.js NDC (-1 to 1)
                const x = ((w - cx2D) / w) * 2 - 1; // Mirrored X
                const y = -(cy2D / h) * 2 + 1;      // Inverted Y
                
                // Calculate 3D Rotation (Yaw, Pitch, Roll)
                // Yaw: how much shoulders are turned towards/away from camera (using Z depth)
                const dz = ls3D.z - rs3D.z;
                const dx3D = ls3D.x - rs3D.x;
                const yaw = Math.atan2(dz, dx3D);
                
                // Roll: tilted shoulders
                const dy = ls.y - rs.y;
                const dx = rs.x - ls.x; // Note: mirrored
                const roll = Math.atan2(dy, dx);
                
                // Scale based on shoulder width pixel distance
                const sw = Math.hypot(ls.x - rs.x, ls.y - rs.y);
                const scale = (sw / w) * 3; // Arbitrary multiplier to fit the viewport
                
                // Update refs for React Three Fiber to read
                poseRef.current = {
                  x: x * 5, // Multiply by frustum width approx
                  y: y * 5 - 1.5, // Offset so it sits below the neck
                  z: -(ls3D.z + rs3D.z) / 2 * 5, // Depth
                  pitch: 0, // simplified
                  yaw: yaw,
                  roll: roll,
                  scale: scale
                };
              }
            }
          } catch(e) {
            // Ignore minor frame drops
          }
        }
      }
      rafRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [status]);


  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-950 rounded-3xl overflow-hidden select-none">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {/* Loading States */}
      {status === 'cam-loading' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-5" />
          <p className="text-xl font-black">Starting Camera...</p>
        </div>
      )}

      {status === 'model-loading' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 text-white">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
          <h3 className="text-2xl font-black">Loading 3D Engine</h3>
          <p className="text-gray-400 text-sm animate-pulse">Initializing WebGL tracking (~4MB)</p>
        </div>
      )}

      {/* 2D Video Feed Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

      {/* 3D WebGL Overlay */}
      {status === 'ready' && selectedProduct && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[0, 5, 5]} intensity={2} />
            <Shirt3D imageUrl={selectedProduct.image_url} poseRef={poseRef} />
          </Canvas>
        </div>
      )}

      {/* Prompts */}
      {status === 'ready' && !selectedProduct && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center text-white px-8 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
            <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2">3D AR Active</h3>
            <p className="text-white/50 text-sm">Pick a garment to wrap it around you in 3D!</p>
          </div>
        </div>
      )}
    </div>
  );
}
