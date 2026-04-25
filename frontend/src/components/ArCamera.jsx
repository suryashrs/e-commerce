import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Sparkles, Loader2, Camera, AlertCircle } from "lucide-react";

const ArCamera = forwardRef(({ selectedProduct, onSnap }, ref) => {
  const singleCanvasRef = useRef(null);
  const videoRef = useRef(null);

  const [status, setStatus] = useState('cam-loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Refs for animation loops
  const poseModelRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);          // requestAnimationFrame ID (60fps video draw)
  const detectionTimerRef = useRef(null); // setInterval ID (15fps pose detection)
  const imgRef = useRef(new Image());
  const imgReadyRef = useRef(false);
  const selectedProductRef = useRef(selectedProduct);
  const lastKpsRef = useRef(null);      // last known pose — used by video draw loop
  const detectingRef = useRef(false);   // prevent concurrent detections

  // Keep selectedProductRef in sync
  useEffect(() => {
    selectedProductRef.current = selectedProduct;
  }, [selectedProduct]);

  // Expose snapshot
  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
      const canvas = singleCanvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/jpeg', 0.95);
    }
  }));

  // ── STEP 1: Camera ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setStatus('cam-loading');

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(stream => {
      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const vid = videoRef.current;
      if (vid) {
        vid.srcObject = stream;
        vid.onloadedmetadata = () => vid.play().then(() => {
          if (mounted) setStatus('model-loading');
        });
      }
    }).catch(() => {
      if (mounted) {
        setErrorMsg('Camera blocked. Click the camera icon in browser address bar → Allow → Refresh.');
        setStatus('error');
      }
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      clearInterval(detectionTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── STEP 2: Load pose model ─────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'model-loading') return;
    let mounted = true;

    (async () => {
      try {
        const tf = await import('@tensorflow/tfjs');
        const pd = await import('@tensorflow-models/pose-detection');
        await tf.ready();
        const det = await pd.createDetector(
          pd.SupportedModels.MoveNet,
          { modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        if (!mounted) return;
        poseModelRef.current = det;
        setStatus('ready');
      } catch (e) {
        if (mounted) {
          setErrorMsg('AR model failed to load. Check internet connection and refresh.');
          setStatus('error');
        }
      }
    })();

    return () => { mounted = false; };
  }, [status]);

  // ── STEP 3: Product image ───────────────────────────────────────────────────
  useEffect(() => {
    imgReadyRef.current = false;
    if (!selectedProduct) return;

    const url = selectedProduct.try_on_image_url?.trim() || selectedProduct.image_url;
    if (!url) return;

    const attempt = (withCors) => {
      const img = new Image();
      if (withCors) img.crossOrigin = 'anonymous';
      img.onload = () => { imgRef.current = img; imgReadyRef.current = true; };
      img.onerror = () => { if (withCors) attempt(false); };
      img.src = withCors ? url : `${url}?_=${Date.now()}`;
    };
    attempt(true);
  }, [selectedProduct]);

  // ── STEP 4a: Video draw loop @ 60fps (smooth, no flickering) ───────────────
  useEffect(() => {
    if (status !== 'ready') return;

    const SMOOTH = 0.7;
    const lerp = (a, b, t) => a + (b - a) * t;

    // Smoothed keypoints updated by detection loop, read by draw loop
    const smoothedKpsRef = { current: null };

    const drawFrame = () => {
      const video = videoRef.current;
      const canvas = singleCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      const W = video.videoWidth;
      const H = video.videoHeight;
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      const ctx = canvas.getContext('2d');

      // 1. Draw mirrored video
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();

      // 2. Smooth incoming detection results
      const raw = lastKpsRef.current;
      if (raw) {
        if (!smoothedKpsRef.current) {
          smoothedKpsRef.current = raw.map(k => ({ ...k }));
        } else {
          smoothedKpsRef.current = raw.map((k, i) => ({
            ...k,
            x: lerp(smoothedKpsRef.current[i].x, k.x, 1 - SMOOTH),
            y: lerp(smoothedKpsRef.current[i].y, k.y, 1 - SMOOTH),
          }));
        }
      }

      // 3. Draw clothes on current frame using smoothed keypoints
      if (smoothedKpsRef.current) {
        drawClothes(ctx, smoothedKpsRef.current, W, H);
      } else {
        drawGuide(ctx, W, H, 'Position yourself in the frame');
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);

    // ── STEP 4b: Pose detection @ 15fps (runs in background) ───────────────
    detectionTimerRef.current = setInterval(async () => {
      const video = videoRef.current;
      const model = poseModelRef.current;
      if (!video || !model || detectingRef.current || video.readyState < 2) return;

      detectingRef.current = true;
      try {
        const W = video.videoWidth;
        const poses = await model.estimatePoses(video, { flipHorizontal: false });
        if (poses.length > 0) {
          // Mirror X coordinates to match the flipped canvas
          lastKpsRef.current = poses[0].keypoints.map(k => ({ ...k, x: W - k.x }));
        } else {
          lastKpsRef.current = null;
        }
      } catch (e) {
        // Silent fail
      }
      detectingRef.current = false;
    }, 67); // ~15fps detection

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(detectionTimerRef.current);
    };
  }, [status]);

  // ── Drawing functions ────────────────────────────────────────────────────────
  const drawClothes = (ctx, kps, W, H) => {
    const get = (name) => {
      const kp = kps.find(k => k.name === name);
      return (kp && kp.score > 0.2) ? kp : null;
    };

    const ls = get('left_shoulder');
    const rs = get('right_shoulder');
    const lh = get('left_hip');
    const rh = get('right_hip');

    const product = selectedProductRef.current;
    const img = imgRef.current;
    const imgReady = imgReadyRef.current;

    if (!ls || !rs) {
      drawGuide(ctx, W, H, 'Show your upper body & shoulders');
      return;
    }

    if (!product || !imgReady || !img || img.naturalWidth === 0) {
      // Show tracking dots so user knows body is detected
      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
      [ls, rs].forEach(kp => {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 7, 0, Math.PI * 2);
        ctx.fill();
      });
      drawGuide(ctx, W, H, product ? 'Loading garment...' : 'Select a garment →');
      return;
    }

    // ── Garment placement ───────────────────────────────────────────────────
    const nose = get('nose');

    // Shoulder geometry
    const shoulderMidX = (ls.x + rs.x) / 2;
    const shoulderMidY = (ls.y + rs.y) / 2;
    const sw = Math.hypot(ls.x - rs.x, ls.y - rs.y);

    // After X-mirroring: ls.x < rs.x (left shoulder is to the left of right shoulder)
    // Use rs - ls so that atan2 gets a positive dx → roll = 0 when sitting straight
    const roll = Math.atan2(rs.y - ls.y, rs.x - ls.x);

    // Cap garment width: never wider than 65% of canvas, never smaller than shoulder width
    const gw = Math.min(sw * 1.75, W * 0.65);
    const aspect = img.naturalHeight / img.naturalWidth;
    let gh = gw * aspect;

    // Scale to torso height if hips visible
    if (lh && rh) {
      const hipMidY = (lh.y + rh.y) / 2;
      const torsoH = Math.abs(hipMidY - shoulderMidY);
      gh = Math.max(gh, torsoH * 1.3);
      gh = Math.min(gh, H * 0.75); // never taller than 75% of frame
    }

    // Collar Y: place the garment's collar just below the chin/nose area
    // If nose detected: collarY = nose + 40% of nose-to-shoulder distance
    // Fallback: collarY = shoulderMidY - 5% of garment height
    let collarY;
    if (nose && nose.score > 0.3) {
      const noseToShoulder = shoulderMidY - nose.y;
      collarY = nose.y + Math.max(noseToShoulder * 0.55, 15);
    } else {
      collarY = shoulderMidY - gh * 0.05;
    }

    // Center X stays at shoulder midpoint
    const collarX = shoulderMidX;

    // ── Dynamic Lighting Detection ──────────────────────────────────────────
    // Sample a small patch of the background video (near the shoulder) to match lighting
    let ambientBrightness = 0.92;
    try {
      // Create a temporary small canvas sample of the background (videoRef)
      // We look at the area around the shoulder to see how bright the room is
      const sampleX = Math.max(0, ls.x - 20);
      const sampleY = Math.max(0, ls.y - 20);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 10; tempCanvas.height = 10;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.drawImage(videoRef.current, sampleX, sampleY, 20, 20, 0, 0, 10, 10);
      const data = tCtx.getImageData(0, 0, 10, 10).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i+1]; b += data[i+2];
      }
      const avg = (r + g + b) / (data.length / 4 * 3 * 255);
      // Map avg brightness (0-1) to a reasonable garment brightness multiplier
      ambientBrightness = 0.7 + (avg * 0.5); 
    } catch(e) { /* fallback to default */ }

    ctx.save();
    ctx.translate(collarX, collarY);
    ctx.rotate(roll);
    ctx.globalAlpha = 0.96;
    
    // Apply dynamic brightness and realistic shadow
    ctx.filter = `brightness(${ambientBrightness.toFixed(2)}) contrast(1.08) drop-shadow(0px 15px 30px rgba(0,0,0,0.55))`;
    
    ctx.drawImage(img, -gw / 2, 0, gw, gh);
    ctx.filter = 'none';
    ctx.restore();

  };

  const drawGuide = (ctx, W, H, msg) => {
    const bw = W * 0.44, bh = H * 0.60;
    const bx = (W - bw) / 2, by = (H - bh) / 2;

    ctx.save();
    ctx.strokeStyle = 'rgba(139,92,246,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 8]);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.setLineDash([]);

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(168,85,247,1)';
    const c = 38;
    [[bx, by, 1, 1],[bx+bw, by, -1, 1],[bx, by+bh, 1, -1],[bx+bw, by+bh, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * c, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * c);
      ctx.stroke();
    });

    if (msg) {
      const padding = 18;
      ctx.font = 'bold 15px system-ui';
      const tw = ctx.measureText(msg).width;
      const bboxW = tw + padding * 2;
      const bboxH = 34;
      const bboxX = (W - bboxW) / 2;
      const bboxY = by + bh / 2 - bboxH / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.roundRect(bboxX, bboxY, bboxW, bboxH, 8);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(msg, W / 2, bboxY + bboxH / 2);
    }
    ctx.restore();
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-950 rounded-3xl overflow-hidden select-none">

      {/* Hidden video — only used for pose detection input */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {/* Camera loading */}
      {status === 'cam-loading' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-5" />
          <p className="text-xl font-black">Starting Camera...</p>
          <p className="text-gray-500 text-sm mt-2 text-center max-w-xs px-4">
            Allow camera access when your browser asks
          </p>
        </div>
      )}

      {/* Model loading — camera visible in background via canvas */}
      {status === 'model-loading' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 text-white">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-purple-900/40 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-spin" />
          </div>
          <h3 className="text-2xl font-black mb-1">Loading AR Engine</h3>
          <p className="text-gray-400 text-sm animate-pulse">One-time download ~3MB</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white px-8 text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mb-4" />
          <h3 className="text-xl font-black mb-3 text-red-300">Camera Error</h3>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">{errorMsg}</p>
          <button onClick={() => window.location.reload()}
            className="mt-6 bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-black transition">
            Retry
          </button>
        </div>
      )}

      {/* No product prompt */}
      {status === 'ready' && !selectedProduct && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center text-white px-8 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2">Select a Garment</h3>
            <p className="text-white/50 text-sm">Pick any item from the collection on the left.</p>
          </div>
        </div>
      )}

      {/* Single canvas — video + clothes drawn together */}
      <canvas
        ref={singleCanvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Bottom Bar */}
      {status === 'ready' && selectedProduct && (
        <div className="absolute bottom-6 left-6 right-6 z-40 flex flex-col gap-3">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 py-3 px-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-semibold">Live AR Active</span>
            </div>
            <span className="text-purple-300 font-black text-xs tracking-widest uppercase">{selectedProduct.name}</span>
          </div>
        </div>
      )}
    </div>
  );
});

ArCamera.displayName = 'ArCamera';
export default ArCamera;
