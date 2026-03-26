import cv2
import numpy as np

def trace_image_to_svg(image_path, output_path):
    print(f"Reading {image_path}...")
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print("Failed to load image.")
        return

    # Invert so black logo becomes white pixels (foreground for findContours)
    _, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)

    # findContours with RETR_TREE to get all nested holes
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print("No contours found.")
        return

    # Generate SVG
    h, w = img.shape
    svg_paths = []
    
    for cnt in contours:
        # Skip microscopic noise
        if cv2.contourArea(cnt) < 10:
            continue
            
        path_data = ""
        for i, pt in enumerate(cnt):
            x, y = pt[0]
            if i == 0:
                path_data += f"M {x} {y} "
            else:
                path_data += f"L {x} {y} "
        path_data += "Z"
        
        svg_paths.append(f'<path d="{path_data}" />')

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="currentColor" fill-rule="evenodd">
    {"".join(svg_paths)}
</svg>'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Successfully generated SVG with {len(svg_paths)} paths at {output_path}")

if __name__ == "__main__":
    trace_image_to_svg(
        r"d:\YO\WS\web\img\SHEET BLACK LOGO (1)-min.jpg",
        r"d:\YO\WS\web\img\logo_traced.svg"
    )
