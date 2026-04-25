import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import ArCamera from "../components/ArCamera";

// ─── AI Try-On helper (uses Gradio client, loaded lazily) ───────────────────
async function runAITryOn(personFile, garmentFile, onStatus) {
  onStatus("Connecting to AI server...");
  const { Client } = await import("@gradio/client");
  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
  if (!HF_TOKEN) {
    throw new Error("Missing Hugging Face token. Set VITE_HF_TOKEN in your environment.");
  }

  // Try backup first (more stable), fall back to original
  const spaces = [
    "yisol/IDM-VTON",                      // Primary — GPU, fastest
    "Kwai-Kolors/Kolors-Virtual-Try-On",   // Fallback — CPU, always running
  ];

  let lastErr;
  for (const spaceId of spaces) {
    try {
      onStatus(`Connecting to ${spaceId}...`);
      const client = await Client.connect(spaceId, { hf_token: HF_TOKEN });

      onStatus("Uploading images & generating fit...");
      const result = await client.predict("/tryon", [
        { background: personFile, layers: [], composite: null },
        garmentFile,
        "garment",
        true,
        false,
        30,
        42,
      ]);

      const out = result?.data?.[0];
      const url = typeof out === "string" ? out : out?.url || out?.name;
      if (url) return url;
      throw new Error("Empty response");
    } catch (err) {
      console.warn(`${spaceId} failed:`, err);
      lastErr = err;
    }
  }
  throw lastErr;
}

// ─── Main Component ──────────────────────────────────────────────────────────
const TryOn = () => {
  // ── original state ──
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [mode, setMode] = useState("photo"); // 'photo' | 'ar' | 'ai'
  const [products, setProducts] = useState([]);
  const [productScale, setProductScale] = useState(0.35);
  const [productPositionY, setProductPositionY] = useState(0.3);
  const [productPositionX, setProductPositionX] = useState(0.5);
  const [opacity, setOpacity] = useState(0.95);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── AI tab state ──
  const [aiPersonFile, setAiPersonFile] = useState(null);
  const [aiPersonPreview, setAiPersonPreview] = useState(null);
  const [aiGarmentFile, setAiGarmentFile] = useState(null);
  const [aiGarmentPreview, setAiGarmentPreview] = useState(null);
  const [aiCatalogProduct, setAiCatalogProduct] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiStatus, setAiStatus] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const aiPersonRef = useRef(null);
  const aiGarmentRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data.filter((p) => p.has_tryon == 1 || p.has_tryon === true));
      } catch (error) {
        console.error("Failed to load products", error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (userImage && selectedProduct) drawCanvas(userImage, selectedProduct);
  }, [productScale, productPositionY, productPositionX, opacity]);

  // ── original handlers ──
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUserImage(img);
        if (selectedProduct) drawCanvas(img, selectedProduct);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (userImage) drawCanvas(userImage, product);
  };

  const drawCanvas = (bgImage, product) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const scale = Math.min(700 / bgImage.width, 600 / bgImage.height, 1);
    canvas.width = bgImage.width * scale;
    canvas.height = bgImage.height * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    const tryOnUrl =
      product.try_on_image_url && product.try_on_image_url.trim() !== ""
        ? product.try_on_image_url
        : product.image_url;
    if (product && tryOnUrl) {
      const productImg = new Image();
      productImg.crossOrigin = "Anonymous";
      productImg.onload = () => {
        ctx.globalAlpha = opacity;
        const pWidth = canvas.width * productScale;
        const pHeight = (productImg.height / productImg.width) * pWidth;
        const x = canvas.width * productPositionX - pWidth / 2;
        const y = canvas.height * productPositionY - pHeight / 2;
        ctx.drawImage(productImg, x, y, pWidth, pHeight);
        ctx.globalAlpha = 1.0;
      };
      productImg.src = tryOnUrl;
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "virtual-tryon.png";
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const resetControls = () => {
    setProductScale(0.35);
    setProductPositionY(0.3);
    setProductPositionX(0.5);
    setOpacity(0.95);
  };

  // ── AI tab handlers ──
  const handleAiPerson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAiPersonFile(file);
    setAiPersonPreview(URL.createObjectURL(file));
    setAiResult(null);
    setAiError("");
  };

  const handleAiGarment = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAiGarmentFile(file);
    setAiGarmentPreview(URL.createObjectURL(file));
    setAiCatalogProduct(null);
    setAiResult(null);
    setAiError("");
  };

  const handleAiCatalogPick = async (product) => {
    setAiCatalogProduct(product);
    setAiGarmentFile(null);
    setAiGarmentPreview(null);
    setAiResult(null);
    setAiError("");
    // Pre-fetch so we have a File object ready
    try {
      const url = product.try_on_image_url || product.image_url;
      const res = await fetch(url);
      const blob = await res.blob();
      const f = new File([blob], "garment.jpg", { type: blob.type });
      setAiGarmentFile(f);
      setAiGarmentPreview(url);
    } catch {
      setAiError("Could not load garment image from catalog.");
    }
  };

  const handleGenerate = async () => {
    if (!aiPersonFile) { setAiError("Upload your photo first."); return; }
    if (!aiGarmentFile) { setAiError("Select or upload a garment."); return; }
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    try {
      const url = await runAITryOn(aiPersonFile, aiGarmentFile, setAiStatus);
      setAiResult(url);
      setAiStatus("");
    } catch (err) {
      setAiError("AI servers are currently busy. Please try again in a moment.");
      setAiStatus("");
    } finally {
      setAiLoading(false);
    }
  };

  const downloadAiResult = () => {
    const a = document.createElement("a");
    a.href = aiResult;
    a.download = "ai-tryon-result.jpg";
    a.click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8 px-4">
        <h1 className="text-3xl sm:text-5xl font-black text-black mb-4 tracking-tighter italic">
          ✨ Try-On Studio
        </h1>
        <p className="text-gray-600 text-sm sm:text-lg font-medium max-w-xl mx-auto">
          Upload your photo and see how our premium collections look on you!
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-1/3 space-y-6">

          {/* Mode Selection – now 3 tabs */}
          <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-gray-300 flex gap-1">
            <button
              onClick={() => setMode("photo")}
              className={`flex-1 py-3 rounded-xl font-bold transition text-sm flex justify-center items-center gap-1 shadow-sm ${mode === "photo" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black"}`}
            >
              📸 Photo
            </button>
            <button
              onClick={() => setMode("ar")}
              className={`flex-1 py-3 rounded-xl font-bold transition text-sm flex items-center justify-center gap-1 shadow-sm ${mode === "ar" ? "bg-purple-600 text-white" : "bg-transparent text-gray-500 hover:text-purple-600"}`}
            >
              🕶️ Live AR
            </button>
            <button
              onClick={() => setMode("ai")}
              className={`flex-1 py-3 rounded-xl font-bold transition text-sm flex items-center justify-center gap-1 shadow-sm ${mode === "ai" ? "bg-indigo-600 text-white" : "bg-transparent text-gray-500 hover:text-indigo-600"}`}
            >
              🤖 Smart Fit
            </button>
          </div>

          {/* ── ORIGINAL PHOTO MODE controls ── */}
          {mode === "photo" && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-300">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                Upload Your Photo
              </h2>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition shadow-md"
              >
                {userImage ? "📸 Change Photo" : "📸 Upload Photo"}
              </button>
              <p className="text-xs text-gray-500 mt-2">Best results with full-body photos</p>
            </div>
          )}

          {/* ── ORIGINAL Select Product (photo + ar modes) ── */}
          {mode !== "ai" && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-300">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                Select Product
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProductSelect(p)}
                    className={`cursor-pointer border-2 rounded-xl p-2 transition-all transform hover:scale-105 ${selectedProduct?.id === p.id ? "border-black ring-2 ring-gray-100 shadow-lg" : "border-gray-100 hover:border-gray-400"}`}
                  >
                    <img src={p.image_url} alt={p.name} className="w-full h-20 sm:h-24 lg:h-28 object-cover rounded-lg mb-2" />
                    <p className="text-[10px] font-bold truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-900 font-black">Rs {p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ORIGINAL Adjustment Controls ── */}
          {mode === "photo" && userImage && selectedProduct && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-300">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                Adjust Position
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Size: {Math.round(productScale * 100)}%</label>
                  <input type="range" min="0.1" max="0.8" step="0.05" value={productScale} onChange={(e) => setProductScale(parseFloat(e.target.value))} className="w-full accent-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Vertical Position</label>
                  <input type="range" min="0" max="1" step="0.01" value={productPositionY} onChange={(e) => setProductPositionY(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Horizontal Position</label>
                  <input type="range" min="0" max="1" step="0.01" value={productPositionX} onChange={(e) => setProductPositionX(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Opacity: {Math.round(opacity * 100)}%</label>
                  <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                </div>
                <button onClick={resetControls} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-semibold">Reset Controls</button>
              </div>
            </div>
          )}

          {/* ── AI TAB: left panel controls ── */}
          {mode === "ai" && (
            <div className="space-y-4">
              {/* Step 1 – Person photo */}
              <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-gray-300">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">1</span>
                  Your Photo
                </h2>
                <input ref={aiPersonRef} type="file" accept="image/*" onChange={handleAiPerson} className="hidden" />
                <button
                  onClick={() => aiPersonRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-3 text-center transition font-semibold text-sm ${aiPersonPreview ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-300 hover:border-indigo-400 text-gray-500"}`}
                >
                  {aiPersonPreview
                    ? <img src={aiPersonPreview} className="mx-auto max-h-36 rounded-lg object-contain" />
                    : "📸 Upload full-body photo"}
                </button>
              </div>

              {/* Step 2 – Garment: catalog or upload */}
              <div className="bg-white p-5 rounded-2xl shadow-lg border-2 border-gray-300">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">2</span>
                  Choose Garment
                </h2>
                <input ref={aiGarmentRef} type="file" accept="image/*" onChange={handleAiGarment} className="hidden" />
                <button
                  onClick={() => aiGarmentRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-3 text-center transition font-semibold text-sm mb-3 ${aiGarmentPreview && !aiCatalogProduct ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-300 hover:border-indigo-400 text-gray-500"}`}
                >
                  {aiGarmentPreview && !aiCatalogProduct
                    ? <img src={aiGarmentPreview} className="mx-auto max-h-28 rounded-lg object-contain" />
                    : "👕 Upload garment image"}
                </button>
                <p className="text-center text-xs text-gray-400 font-semibold mb-3">— or pick from catalog —</p>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAiCatalogPick(p)}
                      className={`cursor-pointer border-2 rounded-xl p-1 transition-all ${aiCatalogProduct?.id === p.id ? "border-indigo-500 ring-2 ring-indigo-100" : "border-gray-100 hover:border-indigo-300"}`}
                    >
                      <img src={p.image_url} alt={p.name} className="w-full h-16 object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={aiLoading || !aiPersonFile || !aiGarmentFile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black text-lg transition shadow-lg"
              >
                {aiLoading ? "⏳ Generating..." : "✨ Generate AI Try-On"}
              </button>

              {aiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-semibold">
                  ⚠️ {aiError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="w-full lg:w-2/3">
          {mode === "ar" ? (
            <ArCamera selectedProduct={selectedProduct} />
          ) : mode === "photo" ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-300 min-h-[600px] flex flex-col">
              <div className="flex-grow flex items-center justify-center">
                {userImage ? (
                  <canvas ref={canvasRef} className="max-w-full rounded-xl shadow-2xl" />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">👗</div>
                    <p className="text-xl font-semibold mb-2">Upload a Photo to Get Started</p>
                    <p className="text-sm">Choose your favorite product and see how it looks on you!</p>
                  </div>
                )}
              </div>
              {userImage && selectedProduct && (
                <div className="mt-6 flex gap-4">
                  <button onClick={downloadImage} className="flex-1 bg-black text-white py-3 px-6 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg">
                    💾 Download Image
                  </button>
                  <Link to={`/product/${selectedProduct.id}`} className="flex-1 bg-white text-black py-3 px-6 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-center border-2 border-black">
                    🛒 Buy This Item
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* ── AI TAB: right side result panel ── */
            <div className="bg-gradient-to-br from-indigo-50 to-slate-100 rounded-2xl border-2 border-indigo-200 min-h-[600px] flex flex-col items-center justify-center p-6">
              {aiLoading ? (
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-indigo-200 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-3xl">🤖</span>
                  </div>
                  <p className="text-indigo-700 font-black text-lg mb-2">AI is working its magic...</p>
                  <p className="text-indigo-500 text-sm font-semibold">{aiStatus}</p>
                  <p className="text-gray-400 text-xs mt-3">Usually takes 20–40 seconds</p>
                </div>
              ) : aiResult ? (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="relative group">
                    <img
                      src={aiResult}
                      alt="AI Try-On Result"
                      className="max-h-[520px] rounded-2xl shadow-2xl border-4 border-white object-contain"
                    />
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                      ✓ AI Generated
                    </div>
                  </div>
                  <div className="flex gap-4 w-full max-w-sm">
                    <button onClick={downloadAiResult} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow">
                      💾 Save
                    </button>
                    <button onClick={() => { setAiResult(null); setAiError(""); }} className="flex-1 bg-white text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow border border-gray-200">
                      🔄 Try Again
                    </button>
                  </div>
                  {aiCatalogProduct && (
                    <Link to={`/product/${aiCatalogProduct.id}`} className="bg-black text-white py-3 px-8 rounded-xl font-bold hover:bg-gray-900 transition shadow text-center w-full max-w-sm">
                      🛒 Buy This Item
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 max-w-sm">
                  <div className="text-7xl mb-6">🤖</div>
                  <p className="text-xl font-bold text-gray-600 mb-2">AI Virtual Try-On</p>
                  <p className="text-sm leading-relaxed">
                    Upload your photo + a garment, then hit <strong className="text-indigo-600">Generate</strong>. The AI will create a photorealistic try-on in seconds.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOn;
