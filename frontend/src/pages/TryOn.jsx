import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import ArCamera from "../components/ArCamera";

const TryOn = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [mode, setMode] = useState("photo"); // 'photo' | 'ar'
  const [products, setProducts] = useState([]);
  const [productScale, setProductScale] = useState(0.35);
  const [productPositionY, setProductPositionY] = useState(0.3);
  const [productPositionX, setProductPositionX] = useState(0.5);
  const [opacity, setOpacity] = useState(0.85);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        const filteredData = data.filter(p => {
          const cat = p.category?.toLowerCase() || '';
          const name = p.name?.toLowerCase() || '';
          return cat.includes('jacket') || cat.includes('pant') || name.includes('jacket') || name.includes('pant');
        });
        setProducts(filteredData);
      } catch (error) {
        console.error("Failed to load products", error);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (userImage && selectedProduct) {
      drawCanvas(userImage, selectedProduct);
    }
  }, [productScale, productPositionY, productPositionX, opacity]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setUserImage(img);
          if (selectedProduct) {
            drawCanvas(img, selectedProduct);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
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
    if (product && product.image_url) {
      const productImg = new Image();
      productImg.crossOrigin = "Anonymous";
      productImg.onload = () => {
        ctx.globalAlpha = opacity;

        // Calculate position and size based on controls
        const pWidth = canvas.width * productScale;
        const pHeight = (productImg.height / productImg.width) * pWidth;
        const x = canvas.width * productPositionX - pWidth / 2;
        const y = canvas.height * productPositionY - pHeight / 2;

        ctx.drawImage(productImg, x, y, pWidth, pHeight);
        ctx.globalAlpha = 1.0;
      };
      productImg.src = product.image_url;
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
    setOpacity(0.85);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-black mb-4">
          🎨 Virtual Try-On Studio
        </h1>
        <p className="text-gray-600 text-lg">
          Upload your photo and see how our products look on you!
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Mode Selection */}
          <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-gray-300 flex">
            <button 
              onClick={() => setMode("photo")}
              className={`flex-1 py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-sm ${mode === "photo" ? "bg-black text-white" : "bg-transparent text-gray-500 hover:text-black"}`}
            >
              📸 Photo
            </button>
            <button 
              onClick={() => setMode("ar")}
              className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm ${mode === "ar" ? "bg-purple-600 text-white" : "bg-transparent text-gray-500 hover:text-purple-600"}`}
            >
              <span className="text-xl">🕶️</span> Live AR
            </button>
          </div>

          {/* Upload Photo (Only in Photo Mode) */}
          {mode === "photo" && (
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition shadow-md"
            >
              {userImage ? "📸 Change Photo" : "📸 Upload Photo"}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Best results with full-body photos
            </p>
          </div>
          )}

          {/* Select Product */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                2
              </span>
              Select Product
            </h2>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleProductSelect(p)}
                  className={`cursor-pointer border-2 rounded-xl p-2 transition-all transform hover:scale-105 ${selectedProduct?.id === p.id
                    ? "border-black ring-4 ring-gray-300 shadow-lg"
                    : "border-gray-200 hover:border-gray-400"
                    }`}
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-28 object-cover rounded-lg mb-2"
                  />
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-gray-700 font-bold">
                    Rs {p.price}
                  </p>
                </div>
              ))}
            </div>
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
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-300 min-h-[600px] flex flex-col">
              <div className="flex-grow flex items-center justify-center">
                {userImage ? (
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
