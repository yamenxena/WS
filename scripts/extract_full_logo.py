import cv2
import numpy as np

def extract_full_logo(image_path, output_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    _, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)

    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    valid_contours = []
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = 0, 0

    h_img, w_img = img.shape
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Filter out the image background bounds but keep EVERYTHING else including thin lines and holes
        if w > w_img * 0.9 and h > h_img * 0.9:
            continue
            
        valid_contours.append(cnt)
        min_x = min(min_x, x)
        min_y = min(min_y, y)
        max_x = max(max_x, x + w)
        max_y = max(max_y, y + h)

    viewBox_w = max_x - min_x
    viewBox_h = max_y - min_y

    all_path_data = ""
    for cnt in valid_contours:
        for i, pt in enumerate(cnt):
            px, py = pt[0]
            px -= min_x
            py -= min_y
            
            if i == 0:
                all_path_data += f"M {px} {py} "
            else:
                all_path_data += f"L {px} {py} "
        all_path_data += "Z "

    # Use a single <path> element so fill-rule="evenodd" correctly carves out nested contours (holes inside letters)
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {viewBox_w} {viewBox_h}" fill="currentColor" fill-rule="evenodd" class="majaz-logo-full">
    <path d="{all_path_data.strip()}" />
</svg>'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Successfully extracted {len(valid_contours)} subpaths into a single unified path to {output_path}")
    print(f"ViewBox: 0 0 {viewBox_w} {viewBox_h}")

if __name__ == "__main__":
    extract_full_logo(
        r"d:\YO\WS\web\img\SHEET BLACK LOGO (1)-min.jpg",
        r"d:\YO\WS\web\img\majaz-full-logo.svg"
    )
