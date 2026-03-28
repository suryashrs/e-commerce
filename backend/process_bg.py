import sys
from PIL import Image
import os

def remove_white_bg(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} does not exist.")
        return False
        
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        # Strip white backgrounds (RGB > 230)
        for item in datas:
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                newData.append((255, 255, 255, 0)) # transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Success: Transparent PNG saved to {output_path}")
        return True
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_bg.py <input_path> <output_path>")
        sys.exit(1)
        
    input_img = sys.argv[1]
    output_img = sys.argv[2]
    
    if remove_white_bg(input_img, output_img):
        sys.exit(0)
    else:
        sys.exit(1)
