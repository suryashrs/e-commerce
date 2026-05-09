import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import ArCamera from "../components/ArCamera";
import Webcam from "react-webcam";

const TryOn = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [mode, setMode] = useState("photo"); // 'photo' | 'smart_try' | 'ar'
  const [products, setProducts] = useState([]);
  const [productScale, setProductScale] = useState(0.35);
  const [productPositionY, setProductPositionY] = useState(0.3);
  const [productPositionX, setProductPositionX] = useState(0.5);
  const [opacity, setOpacity] = useState(0.95);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  // Smart Try garment source: 'catalog' or 'custom'
  const [garmentSource, setGarmentSource] = useState("catalog");
  const [customGarmentImage, setCustomGarmentImage] = useState(null); // { src: dataUrl, name: string }
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const garmentInputRef = useRef(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        const filteredData = data.filter(p => p.has_tryon == 1 || p.has_tryon === true || p.has_tryon === '1');
        setProducts(filteredData);
      } catch (error) {
        console.error("Failed to load products", error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (userImage) {
      drawCanvas(userImage, selectedProduct);
    }
  }, [userImage, selectedProduct, productScale, productPositionY, productPositionX, opacity]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setUserImage(img);
          setGeneratedImage(null);
          if (selectedProduct) {
            drawCanvas(img, selectedProduct);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setUserImage(img);
        setGeneratedImage(null);
        setIsCameraActive(false);
        if (selectedProduct) {
          drawCanvas(img, selectedProduct);
        }
      };
      img.src = imageSrc;
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setGeneratedImage(null);
    if (userImage) {
      drawCanvas(userImage, product);
    }
  };

  const drawCanvas = (bgImage, product) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Set canvas dimensions (max width 700 for display)
    const scale = Math.min(700 / bgImage.width, 600 / bgImage.height, 1);
    canvas.width = bgImage.width * scale;
    canvas.height = bgImage.height * scale;

    // Draw user image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Draw product overlay if selected
    if (product) {
      const tryOnUrl = product.try_on_image_url && product.try_on_image_url.trim() !== "" ? product.try_on_image_url : product.image_url;
      if (tryOnUrl) {
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
        productImg.onerror = (e) => {
          console.error("Failed to load product overlay image in Studio:", tryOnUrl, e);
        };
        productImg.src = tryOnUrl;
      }
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

  const handleCustomGarmentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomGarmentImage({ src: event.target.result, name: file.name });
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get the active garment image URL to send to the AI
  const getActiveGarmentUrl = () => {
    if (garmentSource === "custom" && customGarmentImage) {
      return customGarmentImage.src; // Data URL
    }
    if (selectedProduct) {
      return selectedProduct.try_on_image_url && selectedProduct.try_on_image_url.trim() !== ""
        ? selectedProduct.try_on_image_url
        : selectedProduct.image_url;
    }
    return null;
  };

  const generateSmartTry = async () => {
    const garmentUrl = getActiveGarmentUrl();
    if (!userImage || !garmentUrl) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const response = await fetch("http://localhost/e-commerce/backend/api/smart_tryon.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person_image: userImage.src,
          garment_image: garmentUrl
        })
      });

      const data = await response.json();
      if (data.success && data.image_url) {
        setGeneratedImage(data.image_url);
      } else {
        alert("Failed to generate: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error generating try-on:", error);
      alert("Error generating try-on. Please check your backend connection.");
    } finally {
      setIsGenerating(false);
    }
  };

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
          {/* Mode Selection */}
          <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-gray-300 flex flex-wrap gap-2">
            <button
              onClick={() => setMode("photo")}
              className={`flex-1 py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-sm ${mode === "photo" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black"}`}
            >
              📸 Photo
            </button>
            <button
              onClick={() => setMode("smart_try")}
              className={`flex-1 py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-sm ${mode === "smart_try" ? "bg-blue-600 text-white" : "bg-transparent text-gray-500 hover:text-blue-600"}`}
            >
              ✨ Smart Try-On
            </button>
            <button
              onClick={() => setMode("ar")}
              className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm ${mode === "ar" ? "bg-purple-600 text-white" : "bg-transparent text-gray-500 hover:text-purple-600"}`}
            >
              <span className="text-xl">🕶️</span> Live AR
            </button>
          </div>

          {/* Upload Photo (Only in Photo & Smart Try Mode) */}
          {(mode === "photo" || mode === "smart_try") && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-300">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  1
                </span>
                Upload Your Photo
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsCameraActive(false);
                  }}
                  className="flex-1 bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition shadow-md flex items-center justify-center gap-2"
                >
                  📁 Upload
                </button>
                <button
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition shadow-md flex items-center justify-center gap-2 ${isCameraActive ? "bg-red-500 text-white" : "bg-gray-100 text-black hover:bg-gray-200"}`}
                >
                  {isCameraActive ? "❌ Close" : "📸 Camera"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Best results with full-body photos
              </p>
            </div>
          )}

          {/* Select Garment / Product */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                2
              </span>
              {mode === "smart_try" ? "Select Garment" : "Select Product"}
            </h2>

            {/* Garment Source Toggle - Smart Try only */}
            {mode === "smart_try" && (
              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => { setGarmentSource("catalog"); setGeneratedImage(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${garmentSource === "catalog" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  🛍️ Catalog
                </button>
                <button
                  onClick={() => { setGarmentSource("custom"); setGeneratedImage(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${garmentSource === "custom" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  📤 Custom Upload
                </button>
              </div>
            )}

            {/* Custom Garment Upload - Smart Try only */}
            {mode === "smart_try" && garmentSource === "custom" ? (
              <div>
                <input
                  ref={garmentInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomGarmentUpload}
                  className="hidden"
                />
                <button
                  onClick={() => garmentInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-blue-300 rounded-xl p-4 text-blue-500 hover:bg-blue-50 transition flex flex-col items-center gap-2 mb-3"
                >
                  <span className="text-3xl">👗</span>
                  <span className="font-semibold text-sm">Upload Garment Image</span>
                  <span className="text-xs text-gray-400">JPG, PNG accepted</span>
                </button>
                {customGarmentImage && (
                  <div className="relative group">
                    <img
                      src={customGarmentImage.src}
                      alt="Custom garment"
                      className="w-full h-40 object-contain rounded-xl border-2 border-blue-400 bg-gray-50 p-2"
                    />
                    <button
                      onClick={() => setCustomGarmentImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{customGarmentImage.name}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Catalog Product Grid */
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProductSelect(p)}
                    className={`cursor-pointer border-2 rounded-xl p-2 transition-all transform hover:scale-105 ${selectedProduct?.id == p.id
                      ? "border-black ring-2 ring-gray-100 shadow-lg"
                      : "border-gray-100 hover:border-gray-400"
                      }`}
                  >
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-20 sm:h-24 lg:h-28 object-cover rounded-lg mb-2"
                    />
                    <p className="text-[10px] font-bold truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-900 font-black">
                      Rs {p.price}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adjustment Controls */}
          {mode === "photo" && userImage && selectedProduct && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-300">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  3
                </span>
                Adjust Position
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Size: {Math.round(productScale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={productScale}
                    onChange={(e) =>
                      setProductScale(parseFloat(e.target.value))
                    }
                    className="w-full accent-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Vertical Position
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={productPositionY}
                    onChange={(e) =>
                      setProductPositionY(parseFloat(e.target.value))
                    }
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Horizontal Position
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={productPositionX}
                    onChange={(e) =>
                      setProductPositionX(parseFloat(e.target.value))
                    }
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Opacity: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <button
                  onClick={resetControls}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Reset Controls
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="w-full lg:w-2/3">
          {mode === "ar" ? (
            <ArCamera selectedProduct={selectedProduct} />
          ) : mode === "smart_try" ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border-2 border-blue-200 min-h-[600px] flex flex-col">
              <div className="flex-grow flex flex-col items-center justify-center">
                {isCameraActive ? (
                  <div className="text-center flex flex-col items-center w-full max-w-lg">
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl mb-6 bg-black aspect-video flex items-center justify-center">
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        mirrored={true}
                      />
                      <div className="absolute inset-0 border-4 border-blue-500/30 pointer-events-none rounded-2xl"></div>
                    </div>
                    <button
                      onClick={handleCapture}
                      className="bg-blue-600 text-white py-4 px-12 rounded-full font-black text-xl hover:bg-blue-700 transition shadow-2xl transform hover:scale-105 flex items-center gap-3"
                    >
                      <span className="text-3xl">📸</span> CAPTURE PHOTO
                    </button>
                    <p className="text-gray-500 mt-4 text-sm font-medium">Position yourself clearly in the frame</p>
                  </div>
                ) : !userImage ? (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">✨</div>
                    <p className="text-xl font-semibold mb-2 text-gray-700">
                      Smart Try-On
                    </p>
                    <p className="text-sm">
                      Upload your photo or use camera to get started!
                    </p>
                  </div>
                ) : !(garmentSource === "catalog" ? selectedProduct : customGarmentImage) ? (
                  <div className="text-center">
                    <img src={userImage.src} className="max-h-[400px] w-auto rounded-2xl shadow-2xl border-8 border-white mx-auto mb-6" alt="User" />
                    <div className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold inline-block animate-bounce shadow-lg">
                      {garmentSource === "catalog" ? "⬅️ Now Select a Product to Try On!" : "⬅️ Upload a Garment Image to Try On!"}
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="text-center flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-lg font-bold text-blue-800 animate-pulse">Generating with Smart Try-On...</p>
                    <p className="text-sm text-gray-600 mt-2">This may take a few seconds</p>
                  </div>
                ) : generatedImage ? (
                  <img src={generatedImage} alt="Generated Try-On" className="max-w-full rounded-xl shadow-2xl max-h-[600px] object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="flex gap-6 justify-center items-center mb-8">
                      {userImage ? (
                        <img src={userImage.src} className="h-48 w-auto rounded-xl shadow-lg object-cover border-4 border-white" alt="User" />
                      ) : (
                        <div className="h-48 w-48 rounded-xl bg-white border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-4xl">
                          👤
                        </div>
                      )}
                      <span className="text-4xl text-blue-500">➕</span>
                      {/* Show the active garment preview */}
                      {garmentSource === "custom" && customGarmentImage ? (
                        <div className="text-center">
                          <img src={customGarmentImage.src} className="h-48 w-auto rounded-xl shadow-lg object-contain border-4 border-blue-300 bg-white p-2" alt="Custom Garment" />
                          <p className="text-xs text-blue-600 mt-1 font-semibold">Custom Garment</p>
                        </div>
                      ) : selectedProduct ? (
                        <div className="text-center">
                          <img src={selectedProduct.image_url} className="h-48 w-auto rounded-xl shadow-lg object-cover border-4 border-white bg-white p-2" alt="Product" />
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">{selectedProduct.name}</p>
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={generateSmartTry}
                      disabled={!userImage || !getActiveGarmentUrl()}
                      className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-bold text-lg transition shadow-xl transform hover:scale-105 ${(!userImage || !getActiveGarmentUrl()) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:from-blue-700 hover:to-indigo-700'}`}
                    >
                      ✨ Generate Smart Try-On
                    </button>
                  </div>
                )}
              </div>

              {generatedImage && !isGenerating && (
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <a
                    href={generatedImage}
                    download="vertex-tryon.png"
                    className="flex-1 bg-black text-white py-3 px-6 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg text-center flex items-center justify-center gap-2"
                  >
                    💾 Download Result
                  </a>
                  <button
                    onClick={() => setGeneratedImage(null)}
                    className="flex-1 bg-white text-black py-3 px-6 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-center border-2 border-black flex items-center justify-center gap-2"
                  >
                    🔄 Try Another
                  </button>
                  {selectedProduct && garmentSource === "catalog" && (
                    <Link
                      to={`/product/${selectedProduct.id}`}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-center border-2 border-blue-600 flex items-center justify-center gap-2"
                    >
                      🛒 Buy This Item
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-300 min-h-[600px] flex flex-col">
              <div className="flex-grow flex items-center justify-center">
                {isCameraActive ? (
                  <div className="text-center flex flex-col items-center w-full max-w-lg">
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl mb-6 bg-black aspect-video flex items-center justify-center">
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        mirrored={true}
                      />
                      <div className="absolute inset-0 border-4 border-blue-500/30 pointer-events-none rounded-2xl"></div>
                    </div>
                    <button
                      onClick={handleCapture}
                      className="bg-black text-white py-4 px-12 rounded-full font-black text-xl hover:bg-gray-800 transition shadow-2xl transform hover:scale-105 flex items-center gap-3"
                    >
                      <span className="text-3xl">📸</span> CAPTURE PHOTO
                    </button>
                    <p className="text-gray-500 mt-4 text-sm font-medium">Position yourself clearly in the frame</p>
                  </div>
                ) : userImage ? (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full rounded-xl shadow-2xl"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">👗</div>
                    <p className="text-xl font-semibold mb-2">
                      Upload a Photo to Get Started
                    </p>
                    <p className="text-sm">
                      Choose your favorite product and see how it looks on you!
                    </p>
                  </div>
                )}
              </div>

              {userImage && selectedProduct && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={downloadImage}
                    className="flex-1 bg-black text-white py-3 px-6 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
                  >
                    💾 Download Image
                  </button>
                  <Link
                    to={`/product/${selectedProduct.id}`}
                    className="flex-1 bg-white text-black py-3 px-6 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg text-center border-2 border-black"
                  >
                    🛒 Buy This Item
                  </Link>
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
