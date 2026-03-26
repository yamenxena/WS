import vtracer
import sys
import os

def generate_pro_svg(input_path, output_path):
    print(f"Starting professional vectorization on: {input_path}")
    
    # Using VTracer's Python API to generate a high-fidelity SVG 
    # 'binary' mode is perfect for black logos
    # 'cutout' hierarchical mode ensures holes inside letters are native punch-outs
    # 'spline' mode ensures smooth, gorgeous curves instead of jagged polygons
    
    vtracer.convert_image_to_svg_py(
        input_path,
        out_filename=output_path,
        colormode="binary",        
        hierarchical="cutout",     
        mode="spline",             
        filter_speckle=10,         # Ignore tiny dust particles, but keep thin lines
        color_precision=8,         
        layer_difference=16,
        corner_threshold=60,
        length_threshold=4.0,
        max_iterations=10,
        splice_threshold=45,
        path_precision=3           # Smooth decimal precision
    )
    
    print(f"✅ Successfully written professional SVG lockup to: {output_path}")

    # Read the output to clean up styling so it responds to CSS themes
    with open(output_path, 'r', encoding='utf-8') as f:
        svg_data = f.read()

    # VTracer outputs hardcoded fills (like #000000). We swap them for currentColor
    # so the Majaz theme engine can color it gold/white dynamically.
    svg_data = svg_data.replace('fill="#000000"', 'fill="currentColor"')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_data)
        
if __name__ == "__main__":
    input_file = r"d:\YO\WS\web\img\SHEET BLACK LOGO (1)-min.jpg"
    output_file = r"d:\YO\WS\web\img\majaz-full-logo.svg"
    
    if not os.path.exists(input_file):
        print("Source image missing!")
        sys.exit(1)
        
    generate_pro_svg(input_file, output_file)
