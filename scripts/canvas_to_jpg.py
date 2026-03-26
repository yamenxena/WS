#!/usr/bin/env python3
"""
Obsidian Canvas → High-Resolution JPG Renderer
================================================
Reads an Obsidian .canvas JSON file and renders all nodes and edges
into a high-resolution JPG image using Pillow.

Usage:
    python scripts/canvas_to_jpg.py <path_to.canvas> [--scale N] [--embed]

Options:
    --scale N   Resolution multiplier (default: 2)
    --embed     Add the generated JPG as a file-node in the .canvas JSON

Dependencies: Pillow (pip install pillow)
"""

import json
import math
import os
import re
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pilmoji import Pilmoji

# ══════════════════════════════════════════════════════════════
# CONSTANTS
# ══════════════════════════════════════════════════════════════

# Obsidian canvas color codes → RGB
COLOR_MAP = {
    "1": (233, 49, 71),    # Red
    "2": (233, 168, 71),   # Orange
    "3": (89, 196, 89),    # Green
    "4": (61, 188, 233),   # Cyan
    "5": (164, 114, 233),  # Purple
    "6": (233, 89, 160),   # Pink
}
DEFAULT_NODE_COLOR = (80, 80, 80)
BG_COLOR = (30, 30, 30)          # Dark background
TEXT_COLOR = (240, 240, 240)      # Light text
TEXT_MUTED = (180, 180, 180)      # Muted text
EDGE_COLOR = (120, 120, 120)      # Edge lines
EDGE_LABEL_COLOR = (200, 200, 200)
PADDING = 200                     # Canvas edge padding (in canvas units)
NODE_RADIUS = 12                  # Corner radius (in canvas units)
NODE_PAD_X = 24                   # Inner text padding
NODE_PAD_Y = 20
BORDER_WIDTH = 2

# Header detection patterns
H1_RE = re.compile(r'^#{1}\s+(.+)$')
H2_RE = re.compile(r'^#{2}\s+(.+)$')
H3_RE = re.compile(r'^#{3}\s+(.+)$')
BOLD_RE = re.compile(r'\*\*(.+?)\*\*')
CODE_RE = re.compile(r'`(.+?)`')
TABLE_RE = re.compile(r'^\|(.+)\|$')


# ══════════════════════════════════════════════════════════════
# FONT LOADING
# ══════════════════════════════════════════════════════════════

def _load_font(size):
    """Try to load a system font; fall back to default."""
    candidates = [
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    # Fallback
    try:
        return ImageFont.truetype("arial", size)
    except Exception:
        return ImageFont.load_default()


def _load_bold_font(size):
    """Try to load a bold system font."""
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return _load_font(size)


# ══════════════════════════════════════════════════════════════
# TEXT RENDERING
# ══════════════════════════════════════════════════════════════

def _strip_md(text):
    """Strip markdown formatting for width estimation."""
    text = BOLD_RE.sub(r'\1', text)
    text = CODE_RE.sub(r'\1', text)
    return text


def _render_text_block(draw, pilmoji, text, x, y, max_w, scale, node_color):
    """
    Render markdown-light text into a rectangular area.
    Supports: H1, H2, H3, **bold**, `code`, tables, code blocks.
    Returns the total height consumed.
    """
    base_size = int(24 * scale)
    h1_size = int(36 * scale)
    h2_size = int(30 * scale)
    h3_size = int(26 * scale)
    code_size = int(20 * scale)
    line_spacing = int(12 * scale)

    font_normal = _load_font(base_size)
    font_bold = _load_bold_font(base_size)
    font_h1 = _load_bold_font(h1_size)
    font_h2 = _load_bold_font(h2_size)
    font_h3 = _load_bold_font(h3_size)
    font_code = _load_font(code_size)

    lines = text.split('\n')
    cy = y
    in_code_block = False

    for line in lines:
        stripped = line.strip()

        # Code block toggle
        if stripped.startswith('```'):
            in_code_block = not in_code_block
            continue

        # Code block content
        if in_code_block:
            # Draw monospace-style background
            bbox = font_code.getbbox(stripped)
            tw = bbox[2] - bbox[0] if bbox else 0
            th = bbox[3] - bbox[1] if bbox else int(code_size * 1.2)
            code_bg = tuple(min(c + 30, 255) for c in (BG_COLOR if node_color == DEFAULT_NODE_COLOR else tuple(max(0, c - 40) for c in node_color)))
            draw.rectangle([x, cy, x + max_w, cy + th + int(4 * scale)], fill=code_bg)
            if pilmoji:
                pilmoji.text((x + int(4 * scale), cy + int(2 * scale)), stripped, fill=TEXT_COLOR, font=font_code)
            else:
                draw.text((x + int(4 * scale), cy + int(2 * scale)), stripped, fill=TEXT_COLOR, font=font_code)
            cy += th + int(6 * scale)
            continue

        # Empty line
        if not stripped:
            cy += int(8 * scale)
            continue

        # Table row
        if TABLE_RE.match(stripped):
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            # Skip separator rows
            if all(c.replace('-', '').replace(':', '') == '' for c in cells):
                continue
            cell_w = max_w // max(len(cells), 1)
            
            max_row_h = 0
            cell_lines = []
            
            for cell in cells:
                cell_text = _strip_md(cell)
                # wrap each cell to cell_w - padding
                wrapped_cell = _pixel_wrap(cell_text, pilmoji, font_code, max(cell_w - int(10 * scale), int(10 * scale)))
                cell_lines.append(wrapped_cell)
            
            for i, lines in enumerate(cell_lines):
                cell_y = cy
                for wl in lines:
                    if pilmoji:
                        pilmoji.text((x + i * cell_w + int(5 * scale), cell_y), wl, fill=TEXT_MUTED, font=font_code)
                    else:
                        draw.text((x + i * cell_w + int(5 * scale), cell_y), wl, fill=TEXT_MUTED, font=font_code)
                    bbox = font_code.getbbox(wl)
                    th = bbox[3] - bbox[1] if bbox else code_size
                    cell_y += th + int(4 * scale)
                max_row_h = max(max_row_h, cell_y - cy)
            
            # Subtle row separator
            draw.line([(x, cy + max_row_h + int(2 * scale)), (x + max_w, cy + max_row_h + int(2 * scale))], fill=tuple(c//2 for c in EDGE_COLOR), width=1)
            
            cy += max_row_h + line_spacing
            continue

        # Headings
        m_h1 = H1_RE.match(stripped)
        m_h2 = H2_RE.match(stripped)
        m_h3 = H3_RE.match(stripped)

        if m_h1:
            wrapped = _pixel_wrap(_strip_md(m_h1.group(1)), pilmoji, font_h1, max_w)
            for wl in wrapped:
                if pilmoji:
                    pilmoji.text((x, cy), wl, fill=TEXT_COLOR, font=font_h1)
                else:
                    draw.text((x, cy), wl, fill=TEXT_COLOR, font=font_h1)
                bbox = font_h1.getbbox(wl)
                th = bbox[3] - bbox[1] if bbox else h1_size
                cy += th + line_spacing
            continue

        if m_h2:
            wrapped = _pixel_wrap(_strip_md(m_h2.group(1)), pilmoji, font_h2, max_w)
            for wl in wrapped:
                if pilmoji:
                    pilmoji.text((x, cy), wl, fill=TEXT_COLOR, font=font_h2)
                else:
                    draw.text((x, cy), wl, fill=TEXT_COLOR, font=font_h2)
                bbox = font_h2.getbbox(wl)
                th = bbox[3] - bbox[1] if bbox else h2_size
                cy += th + line_spacing
            continue

        if m_h3:
            wrapped = _pixel_wrap(_strip_md(m_h3.group(1)), pilmoji, font_h3, max_w)
            for wl in wrapped:
                if pilmoji:
                    pilmoji.text((x, cy), wl, fill=TEXT_COLOR, font=font_h3)
                else:
                    draw.text((x, cy), wl, fill=TEXT_COLOR, font=font_h3)
                bbox = font_h3.getbbox(wl)
                th = bbox[3] - bbox[1] if bbox else h3_size
                cy += th + line_spacing
            continue

        # Normal text (handle bold inline)
        display = _strip_md(stripped)
        is_bold = stripped.startswith('**') or stripped.startswith('- **')
        f = font_bold if is_bold else font_normal
        c = TEXT_COLOR if is_bold else TEXT_MUTED
        
        wrapped = _pixel_wrap(display, pilmoji, f, max_w)

        for wl in wrapped:
            if pilmoji:
                pilmoji.text((x, cy), wl, fill=c, font=f)
            else:
                draw.text((x, cy), wl, fill=c, font=f)
            bbox = f.getbbox(wl)
            th = bbox[3] - bbox[1] if bbox else base_size
            cy += th + line_spacing

    return cy - y


def _pixel_wrap(text, pilmoji, font, max_w):
    """Wrap text to fit exactly within max_w pixels using exact font metrics."""
    words = text.split()
    if not words:
        return []
    
    lines = []
    current_line = []
    
    for word in words:
        test_line = " ".join(current_line + [word]) if current_line else word
        
        width = 0
        if pilmoji:
            try:
                width = pilmoji.getsize(test_line, font=font)[0]
            except AttributeError:
                bbox = font.getbbox(test_line)
                width = bbox[2] - bbox[0] if bbox else len(test_line) * 10
        else:
            bbox = font.getbbox(test_line)
            width = bbox[2] - bbox[0] if bbox else len(test_line) * 10
            
        if width <= max_w:
            current_line.append(word)
        else:
            if not current_line:
                # single word is longer than max_w, force it on its own line
                lines.append(word)
                current_line = []
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
                
    if current_line:
        lines.append(" ".join(current_line))
        
    return lines


# ══════════════════════════════════════════════════════════════
# NODE + EDGE RENDERING
# ══════════════════════════════════════════════════════════════

def _anchor(node, side, scale, offset_x, offset_y):
    """Get pixel coordinates for an edge anchor point on a node side."""
    x = (node["x"] - offset_x) * scale
    y = (node["y"] - offset_y) * scale
    w = node["width"] * scale
    h = node["height"] * scale

    if side == "top":
        return (int(x + w / 2), int(y))
    elif side == "bottom":
        return (int(x + w / 2), int(y + h))
    elif side == "left":
        return (int(x), int(y + h / 2))
    elif side == "right":
        return (int(x + w), int(y + h / 2))
    # default: center
    return (int(x + w / 2), int(y + h / 2))


def _draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    r = min(radius, (x1 - x0) // 2, (y1 - y0) // 2)
    # Fill
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * r, y0 + 2 * r], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * r, y0, x1, y0 + 2 * r], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * r, x0 + 2 * r, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * r, y1 - 2 * r, x1, y1], 0, 90, fill=fill)
    # Outline
    if outline:
        draw.arc([x0, y0, x0 + 2 * r, y0 + 2 * r], 180, 270, fill=outline, width=width)
        draw.arc([x1 - 2 * r, y0, x1, y0 + 2 * r], 270, 360, fill=outline, width=width)
        draw.arc([x0, y1 - 2 * r, x0 + 2 * r, y1], 90, 180, fill=outline, width=width)
        draw.arc([x1 - 2 * r, y1 - 2 * r, x1, y1], 0, 90, fill=outline, width=width)
        draw.line([x0 + r, y0, x1 - r, y0], fill=outline, width=width)
        draw.line([x0 + r, y1, x1 - r, y1], fill=outline, width=width)
        draw.line([x0, y0 + r, x0, y1 - r], fill=outline, width=width)
        draw.line([x1, y0 + r, x1, y1 - r], fill=outline, width=width)


def _bezier_points(p0, p1, p2, p3, steps=40):
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        points.append((int(x), int(y)))
    return points

def _draw_arrow(draw, start, end, color, from_side="bottom", to_side="top", width=2):
    """Draw a bezier curve line with an arrowhead."""
    dist = math.hypot(end[0] - start[0], end[1] - start[1])
    ctrl_dist = min(dist * 0.5, 200)
    
    def side_vector(side):
        if side == "left": return (-1, 0)
        if side == "right": return (1, 0)
        if side == "top": return (0, -1)
        if side == "bottom": return (0, 1)
        return (0, 0)
        
    v1 = side_vector(from_side)
    v2 = side_vector(to_side)
    
    p1 = (start[0] + v1[0] * ctrl_dist, start[1] + v1[1] * ctrl_dist)
    p2 = (end[0] + v2[0] * ctrl_dist, end[1] + v2[1] * ctrl_dist)

    points = _bezier_points(start, p1, p2, end, steps=40)
    
    # Draw curve
    draw.line(points, fill=color, width=width, joint="curve")
    
    # Arrowhead
    if len(points) >= 2:
        start_arrow = points[-2]
    else:
        start_arrow = start

    dx = end[0] - start_arrow[0]
    dy = end[1] - start_arrow[1]
    length = math.hypot(dx, dy)
    if length < 1:
        return
    # Normalize
    ux, uy = dx / length, dy / length
    arrow_len = min(16, dist / 4)
    # Perpendicular
    px, py = -uy, ux
    tip = end
    left = (int(tip[0] - arrow_len * ux + arrow_len * 0.4 * px),
            int(tip[1] - arrow_len * uy + arrow_len * 0.4 * py))
    right = (int(tip[0] - arrow_len * ux - arrow_len * 0.4 * px),
             int(tip[1] - arrow_len * uy - arrow_len * 0.4 * py))
    draw.polygon([tip, left, right], fill=color)


# ══════════════════════════════════════════════════════════════
# MAIN RENDER
# ══════════════════════════════════════════════════════════════

def render_canvas(canvas_path, scale=2, embed=False):
    """Render an Obsidian .canvas file to a high-resolution JPG."""
    canvas_path = Path(canvas_path)
    if not canvas_path.exists():
        print(f"Error: File not found: {canvas_path}")
        sys.exit(1)

    with open(canvas_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    if not nodes:
        print("Error: No nodes found in canvas.")
        sys.exit(1)

    # Filter out embedded jpg node so it doesn't affect bounds or draw over edges
    nodes = [n for n in nodes if n.get("id") != "__rendered_jpg__"]

    # Build node lookup
    node_map = {n["id"]: n for n in nodes}

    # ── Pre-pass to adjust node sizes based on text content ──
    img_dummy = Image.new('RGB', (1, 1))
    draw_dummy = ImageDraw.Draw(img_dummy)
    with Pilmoji(img_dummy) as pilmoji_dummy:
        for node in nodes:
            if node.get("type") == "group":
                continue
            text = node.get("text")
            if text:
                nw = int(node["width"] * scale)
                pad_x = int(NODE_PAD_X * scale)
                pad_y = int(NODE_PAD_Y * scale)
                max_w = max(nw - 2 * pad_x, int(50 * scale))
                
                req_h_scaled = _render_text_block(draw_dummy, pilmoji_dummy, text, 0, 0, max_w, scale, DEFAULT_NODE_COLOR)
                req_h = math.ceil(req_h_scaled / scale) + 2 * NODE_PAD_Y
                if req_h > node["height"]:
                    node["height"] = req_h

    # ── Pre-pass 2: Resolve Overlaps ──
    MARGIN = 80  # Unscaled margin between nodes
    for _ in range(50):  # Run multiple iterations to relax the layout
        moved = False
        for i, n1 in enumerate(nodes):
            if n1.get('type') == 'group': continue
            for j, n2 in enumerate(nodes):
                if j <= i: continue
                if n2.get('type') == 'group': continue
                
                x1, y1, w1, h1 = n1["x"], n1["y"], n1["width"], n1["height"]
                x2, y2, w2, h2 = n2["x"], n2["y"], n2["width"], n2["height"]
                
                # Check overlap (with margin)
                if (x1 - MARGIN < x2 + w2 + MARGIN and 
                    x1 + w1 + MARGIN > x2 - MARGIN and 
                    y1 - MARGIN < y2 + h2 + MARGIN and 
                    y1 + h1 + MARGIN > y2 - MARGIN):
                    
                    # Compute penetrations
                    pen_left = (x2 + w2 + MARGIN) - (x1 - MARGIN) # n1 is pushed right
                    pen_right = (x1 + w1 + MARGIN) - (x2 - MARGIN) # n1 is pushed left
                    pen_top = (y2 + h2 + MARGIN) - (y1 - MARGIN) # n1 is pushed down
                    pen_bottom = (y1 + h1 + MARGIN) - (y2 - MARGIN) # n1 is pushed up
                    
                    # Find axis of least penetration
                    min_pen = min(pen_left, pen_right, pen_top, pen_bottom)
                    
                    if min_pen == pen_right:
                        n2["x"] += pen_right / 2
                        n1["x"] -= pen_right / 2
                    elif min_pen == pen_left:
                        n1["x"] += pen_left / 2
                        n2["x"] -= pen_left / 2
                    elif min_pen == pen_bottom:
                        n2["y"] += pen_bottom / 2
                        n1["y"] -= pen_bottom / 2
                    elif min_pen == pen_top:
                        n1["y"] += pen_top / 2
                        n2["y"] -= pen_top / 2
                        
                    moved = True
        if not moved:
            break

    # Compute bounding box
    min_x = min(n["x"] for n in nodes) - PADDING
    min_y = min(n["y"] for n in nodes) - PADDING
    max_x = max(n["x"] + n["width"] for n in nodes) + PADDING
    max_y = max(n["y"] + n["height"] for n in nodes) + PADDING

    img_w = int((max_x - min_x) * scale)
    img_h = int((max_y - min_y) * scale)

    print(f"Canvas bounds: ({min_x},{min_y}) → ({max_x},{max_y})")
    print(f"Image size: {img_w} × {img_h} px (scale={scale})")

    # Create image
    img = Image.new('RGB', (img_w, img_h), BG_COLOR)
    draw = ImageDraw.Draw(img)

    with Pilmoji(img) as pilmoji:
        # ── Draw edges first (under nodes) ──
        label_font = _load_font(int(20 * scale))
        edge_width = max(int(2.5 * scale), 2)
    
        for edge in edges:
            from_node = node_map.get(edge.get("fromNode"))
            to_node = node_map.get(edge.get("toNode"))
            if not from_node or not to_node:
                continue
    
            from_side = edge.get("fromSide", "bottom")
            to_side = edge.get("toSide", "top")
    
            start = _anchor(from_node, from_side, scale, min_x, min_y)
            end = _anchor(to_node, to_side, scale, min_x, min_y)
    
            _draw_arrow(draw, start, end, EDGE_COLOR, from_side=from_side, to_side=to_side, width=edge_width)
    
            # Edge label
            label = edge.get("label")
            if label:
                mid_x = (start[0] + end[0]) // 2
                mid_y = (start[1] + end[1]) // 2
                # Draw label background
                bbox = label_font.getbbox(label)
                tw = bbox[2] - bbox[0] if bbox else len(label) * 6
                th = bbox[3] - bbox[1] if bbox else 12
                pad = int(3 * scale)
                draw.rectangle([mid_x - tw // 2 - pad, mid_y - th // 2 - pad,
                                mid_x + tw // 2 + pad, mid_y + th // 2 + pad],
                               fill=BG_COLOR)
                pilmoji.text((mid_x - tw // 2, mid_y - th // 2), label,
                          fill=EDGE_LABEL_COLOR, font=label_font)

        # ── Draw nodes ──
        # Draw groups first, then others
        sorted_nodes = sorted(nodes, key=lambda n: 0 if n.get("type") == "group" else 1)
        for node in sorted_nodes:
            nx = int((node["x"] - min_x) * scale)
            ny = int((node["y"] - min_y) * scale)
            nw = int(node["width"] * scale)
            nh = int(node["height"] * scale)
            r = int(NODE_RADIUS * scale)
    
            # Node color
            color_key = node.get("color", "")
            base_color = COLOR_MAP.get(color_key, DEFAULT_NODE_COLOR)
            is_group = node.get("type") == "group"
    
            if is_group:
                # Translucent fill for groups
                fill_color = tuple(max(0, c // 5 + 5) for c in base_color)
                border_color = tuple(min(255, int(c * 1.5)) for c in base_color)
                outline_w = max(int(1 * scale), 1)
            else:
                # Dark fill with colored border
                fill_color = tuple(max(0, c // 5 + 15) for c in base_color)
                border_color = base_color
                outline_w = int(BORDER_WIDTH * scale)
    
            _draw_rounded_rect(draw, (nx, ny, nx + nw, ny + nh),
                               r, fill=fill_color, outline=border_color,
                               width=outline_w)
    
            # Render text
            text = node.get("text", "")
            if is_group and node.get("label"):
                text = f"## {node.get('label')}"
                
            if text:
                pad_x = int(NODE_PAD_X * scale)
                pad_y = int(NODE_PAD_Y * scale)
                _render_text_block(draw, pilmoji, text,
                                   nx + pad_x, ny + pad_y,
                                   nw - 2 * pad_x, scale, base_color)

    # ── Save ──
    out_path = canvas_path.with_suffix('.jpg')
    img.save(str(out_path), 'JPEG', quality=95, optimize=True)
    print(f"✅ Saved: {out_path}")
    print(f"   Size: {os.path.getsize(out_path) / 1024:.0f} KB")

    # ── Embed back into canvas ──
    if embed:
        # Use relative path for Obsidian compatibility
        rel_path = out_path.name

        # Check if image node already exists
        existing = [n for n in data["nodes"] if n.get("id") == "__rendered_jpg__"]
        if existing:
            # Update existing
            existing[0]["file"] = rel_path
            existing[0]["width"] = max_x - min_x
            existing[0]["height"] = max_y - min_y
        else:
            # Add new file node as background
            img_node = {
                "id": "__rendered_jpg__",
                "type": "file",
                "file": rel_path,
                "x": min_x,
                "y": min_y,
                "width": max_x - min_x,
                "height": max_y - min_y,
            }
            # Insert at beginning so it renders behind other nodes
            data["nodes"].insert(0, img_node)

        with open(canvas_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent='\t', ensure_ascii=False)
        print(f"📌 Embedded image node into: {canvas_path}")

    return str(out_path)


# ══════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    canvas_file = sys.argv[1]
    scale = 2
    embed = False

    for i, arg in enumerate(sys.argv[2:], 2):
        if arg == "--scale" and i + 1 < len(sys.argv):
            scale = int(sys.argv[i + 1])
        elif arg == "--embed":
            embed = True

    render_canvas(canvas_file, scale=scale, embed=embed)
