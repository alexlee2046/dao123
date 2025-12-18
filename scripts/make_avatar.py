from PIL import Image, ImageOps
import os

def make_avatar(input_path, output_path, size=(750, 750)):
    if not os.path.exists(input_path):
        print(f"Error: File not found at {input_path}")
        return

    try:
        img = Image.open(input_path)
        print(f"Original size: {img.size}")

        # Resize and crop to fill the size (scaling down if necessary, or up)
        # ImageOps.fit works by resizing so that the image fills the requested size, 
        # then cropping the center. This handles the "scale down and crop" logic perfectly.
        # centering=(0.5, 0.5) puts the crop in the middle.
        new_img = ImageOps.fit(img, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        
        print(f"New size: {new_img.size}")
        
        new_img.save(output_path, quality=95)
        print(f"Saved avatar to {output_path}")

    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    input_file = "/Users/alex/Downloads/IMG_6827.jpg"
    output_file = "/Users/alex/Downloads/IMG_6827_avatar.jpg"
    make_avatar(input_file, output_file)
