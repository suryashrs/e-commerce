import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

const ArCamera = ({ selectedProduct }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const guideCanvasRef = useRef(null); // Dedicated top-layer for unaffected bright UI guides
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  // Load the MoveNet model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        setModel(detector);
        setIsModelLoading(false);
      } catch (e) {
        console.error("Error loading tensorflow model", e);
      }
    };
    loadModel();
  }, []);

  // Main pose detection loop
  useEffect(() => {
    if (!model) return;

    let isMounted = true;
    let requestAnimationFrameId;
    const productImage = new Image();
    
    // Deliberately avoiding crossOrigin='anonymous' because local XAMPP backend lacks CORS headers for static uploads.
    // Tainting the canvas is completely fine since we only visually draw the image and never use toDataURL().
    if (selectedProduct) {
      productImage.src = selectedProduct.try_on_image_url || selectedProduct.image_url;
    }

    const detectPose = async () => {
      if (!isMounted) return;

      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        if (
          webcamRef.current.video.width !== videoWidth ||
          webcamRef.current.video.height !== videoHeight
        ) {
          webcamRef.current.video.width = videoWidth;
          webcamRef.current.video.height = videoHeight;
        }

        if (
          canvasRef.current &&
          (canvasRef.current.width !== videoWidth || canvasRef.current.height !== videoHeight)
        ) {
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          if (guideCanvasRef.current) {
            guideCanvasRef.current.width = videoWidth;
            guideCanvasRef.current.height = videoHeight;
          }
        }

        try {
          // Asynchronous block: React may unmount while this runs!
          const poses = await model.estimatePoses(video);
          
          if (!isMounted) return; // Prevent zombie WebGL loops

          if (canvasRef.current && poses.length > 0) {
             drawClothing(poses[0], videoWidth, videoHeight);
          } else if (canvasRef.current && guideCanvasRef.current) {
             const ctx = canvasRef.current.getContext("2d");
             const guideCtx = guideCanvasRef.current.getContext("2d");
             ctx.clearRect(0, 0, videoWidth, videoHeight);
             guideCtx.clearRect(0, 0, videoWidth, videoHeight);
             drawAlignmentGuide(guideCtx, videoWidth, videoHeight);
          }
        } catch (error) {
          console.error("TFJS Processing Error:", error);
          if (canvasRef.current && guideCanvasRef.current) {
             const ctx = canvasRef.current.getContext("2d");
             const guideCtx = guideCanvasRef.current.getContext("2d");
             ctx.clearRect(0, 0, videoWidth, videoHeight);
             guideCtx.clearRect(0, 0, videoWidth, videoHeight);
             drawAlignmentGuide(guideCtx, videoWidth, videoHeight);
          }
        }
      }

      // Loop only if still mounted!
      if (isMounted) {
        requestAnimationFrameId = requestAnimationFrame(detectPose);
      }
    };

    const drawAlignmentGuide = (ctx, videoWidth, videoHeight) => {
      ctx.save();
      // Neon green for maximum visibility against any background
      ctx.strokeStyle = "rgba(0, 255, 100, 0.9)";
      ctx.lineWidth = 6;
      ctx.setLineDash([20, 15]);
      
      // Draw a generic torso box 
      const boxWidth = videoWidth * 0.4;
      const boxHeight = videoHeight * 0.55;
      const boxX = (videoWidth - boxWidth) / 2;
      const boxY = (videoHeight - boxHeight) / 2 + 40;
      
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Draw a head circle above it
      ctx.beginPath();
      ctx.arc(videoWidth / 2, boxY - 50, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Text instruction
      ctx.font = "bold 28px sans-serif";
      ctx.fillStyle = "rgba(0, 255, 100, 1)";
      ctx.textAlign = "center";
      
      // The canvas has transform: scaleX(-1) CSS, so we must draw text flipped on the canvas for it to appear legible to the user!
      ctx.scale(-1, 1);
      ctx.fillText("ALIGN SHOULDERS", -videoWidth / 2, boxY + boxHeight / 2 - 20);
      ctx.fillText("INSIDE BOX", -videoWidth / 2, boxY + boxHeight / 2 + 20);

      ctx.restore();
    };

    const drawClothing = (pose, videoWidth, videoHeight) => {
      const ctx = canvasRef.current.getContext("2d");
      const guideCtx = guideCanvasRef.current.getContext("2d");
      
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      guideCtx.clearRect(0, 0, videoWidth, videoHeight);

      const leftShoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
      const rightShoulder = pose.keypoints.find(k => k.name === 'right_shoulder');
      const leftHip = pose.keypoints.find(k => k.name === 'left_hip');
      const rightHip = pose.keypoints.find(k => k.name === 'right_hip');

      if (leftShoulder && rightShoulder && leftShoulder.score > 0.25 && rightShoulder.score > 0.25 && selectedProduct) {
        
        // If image hasn't loaded yet, draw the alignment guide instead of locking up
        if (!productImage.complete || productImage.naturalHeight === 0) {
           drawAlignmentGuide(guideCtx, videoWidth, videoHeight);
           return;
        }

        const dx = leftShoulder.x - rightShoulder.x;
        const dy = leftShoulder.y - rightShoulder.y;
        const shoulderDist = Math.sqrt(dx * dx + dy * dy);
        
        const centerX = (leftShoulder.x + rightShoulder.x) / 2;
        const centerY = (leftShoulder.y + rightShoulder.y) / 2;
        
        // Scale product width relative to shoulder distance (make it wider to cover arms)
        const width = shoulderDist * 2.1; 
        
        // Match user's specific torso height using hips!
        let height;
        if (leftHip && rightHip && leftHip.score > 0.2 && rightHip.score > 0.2) {
            const midHipY = (leftHip.y + rightHip.y) / 2;
            const torsoHeight = Math.abs(midHipY - centerY);
            height = torsoHeight * 1.4; // Multiplier ensures clothes drape naturally past the waistline
        } else {
            // Fallback to default aspect ratio if hips are off-camera
            const aspect = productImage.naturalHeight / productImage.naturalWidth;
            height = width * aspect;
        }

        ctx.save();
        ctx.translate(centerX, centerY);
        
        const rotAngle = Math.atan2(leftShoulder.y - rightShoulder.y, leftShoulder.x - rightShoulder.x);
        // Do not add + Math.PI. The shoulders render normally oriented since both Dx and canvas mirror cancel out.
        ctx.rotate(rotAngle);
        
        // yOffset pushes the image down so the neck is near the shoulders
        const yOffset = height * 0.15;
        
        // Completely stripped Canvas compositing here. The CSS mix-blend-darken class handles
        // erasing white backgrounds securely on the GPU via DOM layers. Let standard context map image.
        ctx.drawImage(productImage, -width/2, -height/2 + yOffset, width, height);
        ctx.restore();
      } else {
        // If the AI loses confident tracking, show the guide again
        drawAlignmentGuide(guideCtx, videoWidth, videoHeight);
      }
    };

    // Kick off the loop
    detectPose();

    return () => {
      isMounted = false;
      if (requestAnimationFrameId) cancelAnimationFrame(requestAnimationFrameId);
      if (canvasRef.current) {
         const ctx = canvasRef.current.getContext("2d");
         ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      if (guideCanvasRef.current) {
         const guideCtx = guideCanvasRef.current.getContext("2d");
         guideCtx.clearRect(0, 0, guideCanvasRef.current.width, guideCanvasRef.current.height);
      }
    };
  }, [model, selectedProduct]);

  return (
    <div className="relative w-full min-h-[600px] h-full overflow-hidden rounded-2xl shadow-2xl bg-gray-900 border-2 border-gray-300 flex justify-center items-center">
      {isModelLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
          <h3 className="text-2xl font-bold">Opening Virtual Fitting Room...</h3>
          <p className="text-gray-300 mt-2">Preparing your camera...</p>
        </div>
      )}
      
      {!selectedProduct && !isModelLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center text-white px-8 bg-black/60 backdrop-blur-md">
           <div className="text-6xl mb-4">👕</div>
           <p className="text-2xl font-bold mb-2">Virtual Fitting Room Ready</p>
           <p className="text-lg opacity-80">Select a product on the left to try it on!</p>
        </div>
      )}

      <Webcam
        ref={webcamRef}
        muted={true}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: "scaleX(-1)" }}
      />
      
      {/* Lower layer for Clothes: uses CSS mix-blend-darken mapped over the webcam feed to erase white backgrounds seamlessly! */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none mix-blend-darken"
        style={{ transform: "scaleX(-1)" }}
      />
      
      {/* Upper layer for Glowing Tech UI Lines: Completely ignores CSS blending, safely drawing solid neon UI instructions */}
      <canvas
        ref={guideCanvasRef}
        className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
        style={{ transform: "scaleX(-1)" }}
      />

      {selectedProduct && !isModelLoading && (
        <div className="absolute top-4 left-4 right-4 z-30 bg-black/60 text-white px-5 py-3 rounded-xl text-sm backdrop-blur shadow-lg border border-white/10 flex items-center justify-between pointer-events-none">
           <div className="flex items-center gap-3">
             <span className="text-2xl animate-pulse">✨</span>
             <div>
                <p className="font-bold">Body Tracking Active</p>
                <p className="opacity-80 text-xs">Stand back so the camera can see your shoulders and torso.</p>
             </div>
           </div>
           <div className="bg-purple-600 px-3 py-1 rounded-lg font-semibold text-xs text-white">
             {selectedProduct.name}
           </div>
        </div>
      )}
    </div>
  );
};
export default ArCamera;
