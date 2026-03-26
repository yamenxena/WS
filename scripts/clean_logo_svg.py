"""
Majaz Logo SVG Cleanup Script
- Removes the black background rectangle (first huge path)
- Groups elements semantically (logo mark, typography, side lines)
- Makes cls-1 elements use currentColor for theme control
- Keeps cls-2 (blue #2676ba) static
- Outputs a clean, transparent SVG
"""
import re
import xml.etree.ElementTree as ET

ET.register_namespace('', 'http://www.w3.org/2000/svg')

def clean_svg(input_path, output_path):
    tree = ET.parse(input_path)
    root = tree.getroot()
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    
    # Remove <defs> (old style block) — we'll define styles inline
    for defs in root.findall('svg:defs', ns):
        root.remove(defs)
    
    # Remove <title>
    for title in root.findall('svg:title', ns):
        root.remove(title)
    
    # Collect all paths
    paths = root.findall('svg:path', ns)
    print(f"Total paths found: {len(paths)}")
    
    # The FIRST path is the massive black background — remove it
    bg_path = paths[0]
    d_data = bg_path.get('d', '')
    # Verify it's the background (starts near 0,0 and covers the full viewbox)
    if d_data.startswith('M.14,') or d_data.startswith('M0,'):
        print(f"Removing background path (length: {len(d_data)} chars)")
        root.remove(bg_path)
        paths = paths[1:]
    
    # Categorize remaining paths
    blue_paths = []
    main_paths = []
    unclassed_paths = []
    
    for p in paths:
        cls = p.get('class', '')
        if 'cls-2' in cls:
            blue_paths.append(p)
        elif 'cls-1' in cls:
            main_paths.append(p)
        else:
            unclassed_paths.append(p)  # small detail paths (dots inside letters)
    
    print(f"Main paths (cls-1, white→currentColor): {len(main_paths)}")
    print(f"Blue paths (cls-2, static #2676ba): {len(blue_paths)}")
    print(f"Unclassed paths (letter details): {len(unclassed_paths)}")
    
    # Remove all paths from root first
    for p in root.findall('svg:path', ns):
        root.remove(p)
    
    # Clean root attributes
    root.attrib.pop('id', None)
    root.attrib.pop('data-name', None)
    
    # Build new clean structure
    # Group 1: Main brand elements (currentColor for theme control)
    main_group = ET.SubElement(root, 'g')
    main_group.set('class', 'majaz-brand-main')
    main_group.set('fill', 'currentColor')
    
    for p in main_paths:
        p.attrib.pop('class', None)
        p.attrib.pop('transform', None)
        main_group.append(p)
    
    for p in unclassed_paths:
        p.attrib.pop('class', None)
        p.attrib.pop('transform', None)
        main_group.append(p)
    
    # Group 2: Blue accent (static color)
    blue_group = ET.SubElement(root, 'g')
    blue_group.set('class', 'majaz-brand-blue')
    blue_group.set('fill', '#2676ba')
    
    for p in blue_paths:
        p.attrib.pop('class', None)
        p.attrib.pop('transform', None)
        blue_group.append(p)
    
    # Write clean SVG
    tree.write(output_path, encoding='unicode', xml_declaration=False)
    
    # Post-process: add proper XML declaration and clean up
    with open(output_path, 'r', encoding='utf-8') as f:
        svg_text = f.read()
    
    # Remove any leftover transform attributes referencing the old coordinate shift
    svg_text = svg_text.replace(' transform="translate(-0.14 -0.14)"', '')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_text)
    
    print(f"\n✅ Clean SVG written to: {output_path}")

if __name__ == "__main__":
    clean_svg(
        r"d:\YO\WS\web\img\SHEET BLACK LOGO (1)-min.svg",
        r"d:\YO\WS\web\img\majaz-logo-clean.svg"
    )
