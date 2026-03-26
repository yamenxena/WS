import cv2
import numpy as np

def extract_majaz_mark(image_path, output_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    _, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)

    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter contours belonging to the Majaz mark (x < 12000)
    mark_contours = []
    min_x, min_y = float('inf'), float('inf')
    max_x, max_y = 0, 0

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if cv2.contourArea(cnt) > 100 and w < 29000:
            if x < 12000:
                mark_contours.append(cnt)
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x + w)
                max_y = max(max_y, y + h)

    viewBox_w = max_x - min_x
    viewBox_h = max_y - min_y

    svg_paths = []
    for cnt in mark_contours:
        path_data = ""
        for i, pt in enumerate(cnt):
            # Shift coordinates tightly to bounding box
            px, py = pt[0]
            px -= min_x
            py -= min_y
            
            if i == 0:
                path_data += f"M {px} {py} "
            else:
                path_data += f"L {px} {py} "
        path_data += "Z"
        svg_paths.append(f'<path d="{path_data}" />')

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {viewBox_w} {viewBox_h}" fill="currentColor" fill-rule="evenodd" class="majaz-logo-svg">
    {"".join(svg_paths)}
</svg>'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Successfully extracted {len(svg_paths)} paths to {output_path}")
    print(f"ViewBox: 0 0 {viewBox_w} {viewBox_h}")

if __name__ == "__main__":
    extract_majaz_mark(
        r"d:\YO\WS\web\img\SHEET BLACK LOGO (1)-min.jpg",
        r"d:\YO\WS\web\img\majaz-mark.svg"
    )
