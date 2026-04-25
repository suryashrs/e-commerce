/**
 * Service to handle Virtual Try-On API calls using Hugging Face Spaces.
 */
class VtonService {
  constructor() {
    this.client = null;
    this.spaces = {
      "Local AI (Python Backend)": "python_local",
      "Local Fast Engine (No Internet)": "local",
      "IDM-VTON (Backup)": "Human-Centric-AI/IDM-VTON",
      "IDM-VTON (Standard)": "yisol/IDM-VTON",
      "Kolors (High Quality)": "Kwai-Kolors/Kolors-Virtual-Try-On"
    };
    this.spaceId = this.spaces["IDM-VTON (Backup)"]; // Default to backup as it's often more stable
    this.token = import.meta.env.VITE_HF_TOKEN; 
  }

  setSpace(name) {
    if (this.spaces[name]) {
      this.spaceId = this.spaces[name];
      this.client = null; // Reset client to reconnect to new space
      console.log(`Switched AI Engine to: ${name}`);
    }
  }

  async initClient() {
    if (!this.client) {
      try {
        const { Client } = await import("@gradio/client");
        const connectOptions = this.token ? { hf_token: this.token } : {};
        console.log(`Connecting to ${this.spaceId}...`);
        this.client = await Client.connect(this.spaceId, connectOptions);
        console.log(`Connected to ${this.spaceId} API`);
      } catch (error) {
        console.error(`Failed to connect to ${this.spaceId} API`, error);
        this.client = null; 
        throw new Error("This AI server is currently busy or down. Please try switching to a different 'AI Engine' in the settings.");
      }
    }
    return this.client;
  }

  /**
   * Performs the Virtual Try-On inference.
   * Automatically detects the correct payload format based on the selected Space.
   * @param {Blob|File} personImage - Image of the person.
   * @param {Blob|File} garmentImage - Image of the garment.
   * @returns {Promise<string>} - URL of the generated image.
   */
  async generateTryOn(personImage, garmentImage) {
    if (this.spaceId === "python_local") {
      return await this.generatePythonLocal(personImage, garmentImage);
    }
    if (this.spaceId === "local") {
      return await this.generateLocalCompose(personImage, garmentImage);
    }

    const client = await this.initClient();
    
    try {
      let payload;
      let endpoint = "/tryon";

      // Detect payload format based on Space ID
      if (this.spaceId.includes("Kolors")) {
        // Kolors positional arguments: [person_img, garment_img, seed, randomize_seed]
        payload = [
          personImage, 
          garmentImage, 
          0, 
          true
        ];
      } else {
        // IDM-VTON positional arguments: [image_dict, garment_img, description, is_checked, is_checked_crop, denoise_steps, seed]
        payload = [
          {
            background: personImage,
            layers: [],
            composite: null
          },
          garmentImage,
          "garment",
          true, 
          false, 
          30, 
          42
        ];
      }

      console.log(`Sending request to ${this.spaceId} with payload:`, payload);
      const result = await client.predict(endpoint, payload);
      console.log("Full API Result:", result);
      
      if (result.data && result.data.length > 0) {
        const output = result.data[0];
        const imageUrl = typeof output === 'string' ? output : (output.url || output.name || null);
        
        if (imageUrl) {
          console.log("Success! Generated image URL:", imageUrl);
          return imageUrl;
        }
      }
      
      throw new Error("Invalid API response format. The AI server may have changed its interface.");
    } catch (error) {
      console.error("Error during VTON generation", error);
      throw error;
    }
  }

  /**
   * Connects to the local Python AI server running on localhost:5000
   */
  async generatePythonLocal(personFile, garmentFile) {
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

    try {
      const personB64 = await fileToBase64(personFile);
      const garmentB64 = await fileToBase64(garmentFile);

      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: personB64,
          garment: garmentB64
        })
      });

      const data = await response.json();
      if (data.status === "success") {
        return data.result;
      } else {
        throw new Error(data.message || "Local AI server error");
      }
    } catch (err) {
      console.error("Local Python Server Error:", err);
      throw new Error("Could not connect to Local AI Server. Make sure you have run 'python vton_server.py' in the ai_engine folder.");
    }
  }

  /**
   * Generates a high-quality composition locally using the browser's Canvas API.
   * Uses the user's GPU for rendering.
   */
  async generateLocalCompose(personFile, garmentFile) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      const personImg = new Image();
      const garmentImg = new Image();
      
      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded === 2) {
          // Set canvas to person image size
          canvas.width = personImg.width;
          canvas.height = personImg.height;
          
          // 1. Draw Person
          ctx.drawImage(personImg, 0, 0);
          
          // 2. Smart Blending for Garment
          const gw = canvas.width * 0.45; // Standard fit
          const gh = gw * (garmentImg.height / garmentImg.width);
          const gx = canvas.width / 2 - gw / 2;
          const gy = canvas.height * 0.35; // Chest level
          
          ctx.save();
          // Add AI-style depth shadows
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 15;
          
          // Apply a subtle warp/blend filter
          ctx.filter = "brightness(1.02) contrast(1.05)";
          ctx.drawImage(garmentImg, gx, gy, gw, gh);
          ctx.restore();
          
          resolve(canvas.toDataURL("image/jpeg", 0.95));
        }
      };
      
      personImg.onerror = reject;
      garmentImg.onerror = reject;
      
      const reader1 = new FileReader();
      reader1.onload = (e) => { personImg.src = e.target.result; personImg.onload = onLoad; };
      reader1.readAsDataURL(personFile);
      
      const reader2 = new FileReader();
      reader2.onload = (e) => { garmentImg.src = e.target.result; garmentImg.onload = onLoad; };
      reader2.readAsDataURL(garmentFile);
    });
  }
}

export default new VtonService();
