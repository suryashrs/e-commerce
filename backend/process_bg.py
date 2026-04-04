import sys
import os
from rembg import remove
from PIL import Image
import io

def remove_background(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} does not exist.")
        return False
        
    try:
        print(f"Starting AI background removal for: {input_path}")
        with open(input_path, 'rb') as i:
            input_data = i.read()
            # rembg.remove handles the AI processing
            output_data = remove(input_data)
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'wb') as o:
                o.write(output_data)
        
        print(f"Success: AI Background Removal completed. Saved to {output_path}")
        return True
    except Exception as e:
        print(f"Error processing image with AI: {str(e)}")
        # Fallback to a refined Pillow threshold logic if AI fails
        return fallback_remove_white_bg(input_path, output_path)

def fallback_remove_white_bg(input_path, output_path):
    print("Attempting fallback threshold removal...")
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        newData = []
        for item in datas:
            # More conservative threshold for fallback
            if item[0] > 245 and item[1] > 245 and item[2] > 245:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        img.save(output_path, "PNG")
        return True
    except Exception as e:
        print(f"Fallback also failed: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_bg.py <input_path> <output_path>")
        sys.exit(1)
        
    input_img = sys.argv[1]
    output_img = sys.argv[2]
    
    if remove_background(input_img, output_img):
        sys.exit(0)
    else:
        sys.exit(1)
