import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import ArCamera from "../components/ArCamera";
import vtonService from "../services/vtonService";
import { Sparkles, Camera, Image as ImageIcon, Download, ShoppingBag, Loader2, UploadCloud, AlertCircle, Move, RotateCw, Trash2, Sliders } from "lucide-react";

const TryOn = () => {
  // Modes: 'ar' (Live Mirror), 'studio' (Manual Dragging + AI Enhancement)
  const [mode, setMode] = useState("ar"); 
  
  // Data
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // User Inputs
  const [userImage, setUserImage] = useState(null);
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [customGarmentFile, setCustomGarmentFile] = useState(null);
  const [customGarmentPreview, setCustomGarmentPreview] = useState(null);
  const [customGarmentImage, setCustomGarmentImage] = useState(null);
  
  // Manual Dragging State
  const [pos, setPos] = useState({ x: 0.5, y: 0.4 });
  const [scale, setScale] = useState(0.4);
  const [opacity, setOpacity] = useState(0.95);
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [hdResult, setHdResult] = useState(null);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const garmentInputRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data.filter(p => p.has_tryon == 1 || p.has_tryon === true));
      } catch (error) { console.error(error); }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (mode === 'studio' && userImage) renderCanvas();
  }, [mode, userImage, selectedProduct, customGarmentImage, pos, scale, opacity, hdResult]);

  const handleUserPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserImageUrl(ev.target.result);
        const img = new Image();
        img.onload = () => setUserImage(img);
        img.src = ev.target.result;
        setHdResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGarmentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomGarmentFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomGarmentPreview(ev.target.result);
        const img = new Image();
        img.onload = () => setCustomGarmentImage(img);
        img.src = ev.target.result;
        setSelectedProduct(null);
        setHdResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !userImage) return;
    const ctx = canvas.getContext('2d');
    
    // Draw result if exists, otherwise draw source + overlay
    if (hdResult) {
      const resImg = new Image();
      resImg.onload = () => {
        canvas.width = resImg.width;
        canvas.height = resImg.height;
        ctx.drawImage(resImg, 0, 0);
      };
      resImg.src = hdResult;
      return;
    }

    const containerWidth = canvas.parentElement.clientWidth - 40;
    const scaleFactor = containerWidth / userImage.width;
    canvas.width = userImage.width * scaleFactor;
    canvas.height = userImage.height * scaleFactor;
    
    ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);
    
    const gImg = customGarmentImage || (selectedProduct ? document.getElementById(`prod-img-${selectedProduct.id}`) : null);
    if (gImg) {
      const gw = canvas.width * scale;
      const gh = gw * (gImg.naturalHeight / gImg.naturalWidth);
      const gx = canvas.width * pos.x - gw / 2;
      const gy = canvas.height * pos.y - gh * 0.1;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.drawImage(gImg, gx, gy, gw, gh);
      ctx.restore();
    }
  };

  const handleAIEnhance = async () => {
    if (!userFile) return;
    let garmentBlob = customGarmentFile;
    if (!garmentBlob && selectedProduct) {
      const response = await fetch(selectedProduct.image_url);
      garmentBlob = await response.blob();
    }
    if (!garmentBlob) return;

    setIsGenerating(true);
    setError(null);
    try {
      const resultUrl = await vtonService.generateTryOn(userFile, garmentBlob);
      setHdResult(resultUrl);
    } catch (err) {
      setError(err.message || "AI Error");
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-10 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Modern Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 backdrop-blur-xl p-1.5 rounded-[2rem] border border-white/5 flex gap-2">
            <button onClick={() => setMode('ar')} className={`px-10 py-4 rounded-[1.8rem] font-black text-sm transition-all flex items-center gap-3 ${mode === 'ar' ? 'bg-indigo-600 shadow-2xl' : 'text-slate-400 hover:text-white'}`}>
              <Camera size={20} /> LIVE MIRROR
            </button>
            <button onClick={() => setMode('studio')} className={`px-10 py-4 rounded-[1.8rem] font-black text-sm transition-all flex items-center gap-3 ${mode === 'studio' ? 'bg-indigo-600 shadow-2xl' : 'text-slate-400 hover:text-white'}`}>
              <Sparkles size={20} /> ADVANCED STUDIO
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Panel: Controls */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            {mode === 'studio' && (
              <>
                <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">1. Upload Scene</h3>
                  <div className="space-y-4">
                    <button onClick={() => fileInputRef.current.click()} className="w-full h-32 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:border-indigo-500 transition-all bg-slate-900/50 group">
                      {userImageUrl ? <img src={userImageUrl} className="w-full h-full object-cover rounded-[1.4rem]" /> : <><UploadCloud className="mb-2 text-slate-500 group-hover:text-indigo-400" /> <span className="text-[10px] font-bold text-slate-500">YOU</span></>}
                    </button>
                    <input type="file" hidden ref={fileInputRef} onChange={handleUserPhotoUpload} />
                    
                    <button onClick={() => garmentInputRef.current.click()} className="w-full h-32 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:border-indigo-500 transition-all bg-slate-900/50 group">
                      {customGarmentPreview ? <img src={customGarmentPreview} className="w-full h-full object-cover rounded-[1.4rem]" /> : <><UploadCloud className="mb-2 text-slate-500 group-hover:text-indigo-400" /> <span className="text-[10px] font-bold text-slate-500">GARMENT</span></>}
                    </button>
                    <input type="file" hidden ref={garmentInputRef} onChange={handleGarmentUpload} />
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">2. Fine Tune</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-black mb-2 uppercase"><span>Size</span><span>{Math.round(scale*100)}%</span></div>
                      <input type="range" min="0.1" max="1.5" step="0.01" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-black mb-2 uppercase"><span>Height</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={pos.y} onChange={e => setPos({...pos, y: parseFloat(e.target.value)})} className="w-full accent-indigo-500" />
                    </div>
                    <button onClick={() => {setPos({x:0.5, y:0.4}); setScale(0.4); setHdResult(null);}} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition">Reset Pose</button>
                  </div>
                </div>
              </>
            )}

            <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-white/5 flex-grow overflow-hidden flex flex-col">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">Catalog</h3>
              <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {products.map(p => (
                  <div key={p.id} onClick={() => {setSelectedProduct(p); setCustomGarmentPreview(null); setCustomGarmentImage(null); setHdResult(null);}} className={`cursor-pointer rounded-2xl border-2 p-1 transition-all ${selectedProduct?.id === p.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent hover:border-slate-700'}`}>
                    <img id={`prod-img-${p.id}`} src={p.image_url} className="w-full aspect-[3/4] object-cover rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Main Stage */}
          <div className="flex-grow flex flex-col gap-6">
            <div className="bg-slate-900 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex-grow min-h-[700px] flex items-center justify-center">
              {mode === 'ar' ? (
                <ArCamera selectedProduct={selectedProduct} />
              ) : (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center">
                  {userImageUrl ? (
                    <div className="relative group">
                      <canvas ref={canvasRef} className="max-w-full h-auto rounded-3xl shadow-2xl border border-white/10" />
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center">
                          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest animate-pulse">AI Fitting...</p>
                        </div>
                      )}
                      {!isGenerating && userImageUrl && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                          <button onClick={handleAIEnhance} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl font-black text-sm shadow-2xl flex items-center gap-2 scale-110 active:scale-95 transition-all">
                            <Sparkles size={18} /> PERFECT WITH AI
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center opacity-40">
                      <ImageIcon size={60} className="mx-auto mb-6" />
                      <p className="font-black text-sm uppercase tracking-widest">Upload a photo to begin styling</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default TryOn;
