import cv2
import numpy as np

img = cv2.imread(r'd:\YO\WS\web\img\SHEET BLACK LOGO (1)-min.jpg', cv2.IMREAD_GRAYSCALE)
h, w = img.shape
print(f"Image dimensions: {w}x{h}")

# Check pixel intensity distribution
print(f"\nMin pixel value: {img.min()}")
print(f"Max pixel value: {img.max()}")
print(f"Mean pixel value: {img.mean():.1f}")

# Count pixels at various thresholds
for thresh_val in [50, 100, 128, 150, 180, 200, 220, 240, 250]:
    count = np.sum(img < thresh_val)
    pct = count / (h * w) * 100
    print(f"Pixels below {thresh_val}: {count:>10,} ({pct:.2f}%)")

# Check specific regions for the side lines
# Left side line should be around x=6000-7000
# Right side line should be around x=22000-23000
print("\n--- Region analysis ---")
regions = {
    "Left-line area (x=6500-7200)": img[:, 6500:7200],
    "Right-line area (x=22500-23200)": img[:, 22500:23200],
    "Logo mark area (x=8800-11200)": img[:, 8800:11200],
    "Arabic text area (x=13000-22000, y=1500-2700)": img[1500:2700, 13000:22000],
    "English text area (x=13000-22000, y=2800-4800)": img[2800:4800, 13000:22000],
}

for name, region in regions.items():
    dark = np.sum(region < 200)
    total = region.size
    print(f"{name}: {dark:>10,} dark pixels / {total:>10,} total ({dark/total*100:.2f}%), min={region.min()}, mean={region.mean():.1f}")

# Try different thresholds and count contours
for thresh_val in [128, 200, 230, 245, 252]:
    _, t = cv2.threshold(img, thresh_val, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(t, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    valid = [c for c in contours if cv2.boundingRect(c)[2] < w * 0.9]
    print(f"\nThreshold {thresh_val}: {len(valid)} valid contours")
    # Show bounding boxes of the largest contours
    boxes = sorted([cv2.boundingRect(c) for c in valid], key=lambda b: b[2]*b[3], reverse=True)
    for x, y, bw, bh in boxes[:10]:
        print(f"  x={x} y={y} w={bw} h={bh}")
