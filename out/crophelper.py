#!/usr/bin/env python3
"""Crop a region from live + rep screenshots, scale up, stack vertically for comparison.
Usage: python3 crophelper.py <name> <x> <y> <w> <h> [scale] [outname]
Crops same region (offset by dx,dy if given) from captures/<cap>/full.png and compare/<name>-rep.png.
"""
import sys
from PIL import Image

ROOT = '/Users/godw/GodwGarage/sandbox/高校人才/replica'
MAP = {
  'index': 'portal-home', 'learning': 'learning', 'learning-all': 'learning-all',
  'course-detail': 'learning-course-detail', 'cert': 'cert', 'ict-academy': 'ict-academy',
  'contest': 'contest', 'halp': 'halp', 'stories': 'stories', 'news': 'news',
  'find-academy': 'find-academy', 'search-results': 'portal-search-shuangxuan',
  'login': 'uniportal-login', 'uc-home': 'uc-home', 'uc-mycourse': 'uc-mycourse',
  'uc-myclass-list': 'uc-myclass-list', 'uc-mycomp': 'uc-mycomp', 'uc-mycoupons': 'uc-mycoupons',
  'uc-mynews': 'uc-mynews', 'uc-mycert': 'uc-mycert', 'uc-myexam': 'uc-myexam',
  'uc-myinfo': 'uc-myinfo', 'uc-realinfo': 'uc-realinfo', 'uc-voucher-app': 'uc-voucher-app',
}

name, x, y, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
scale = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
outname = sys.argv[7] if len(sys.argv) > 7 else name
# optional offsets: live_x live_y rep_x rep_y
lx, ly, rx, ry = (int(sys.argv[i]) for i in range(8, 12)) if len(sys.argv) > 12 else (x, y, x, y)

live = Image.open(f'{ROOT}/captures/{MAP[name]}/full.png').convert('RGB')
rep = Image.open(f'{ROOT}/compare/{name}-rep.png').convert('RGB')
a = live.crop((lx, ly, lx + w, ly + h))
b = rep.crop((rx, ry, rx + w, ry + h))
if scale != 1.0:
    a = a.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    b = b.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
W = max(a.width, b.width)
canvas = Image.new('RGB', (W, a.height + b.height + 70), '#ffffff')
canvas.paste(a, (0, 30))
canvas.paste(b, (0, a.height + 60))
out = f'/tmp/crop-{outname}.png'
canvas.save(out)
print(out, canvas.size)
