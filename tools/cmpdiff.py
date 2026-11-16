#!/usr/bin/env python3
# 对比 compare/<name>-cmp.png 左右两半，输出行级差异报告
import os
import sys
from PIL import Image, ImageChops

name = sys.argv[1]
# 仓库根 = 本文件上一级（任意 checkout 均可运行）
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, 'replica', 'compare', f'{name}-cmp.png')
im = Image.open(path).convert('RGB')
w, h = im.size
half = w // 2
L = im.crop((0, 0, half, h))
R = im.crop((half, 0, w, h))
# 尺寸对齐
H = min(L.height, R.height)
L = L.resize((900, int(L.height * 900 / L.width)))
R = R.resize((900, int(R.height * 900 / R.width)))
H = min(L.height, R.height)
print(f'live scaled {L.size}, rep scaled {R.size}')
diff = ImageChops.difference(L.crop((0,0,900,H)), R.crop((0,0,900,H)))
# 行平均差
import statistics
rows = []
px = diff.load()
for y in range(H):
    s = 0
    for x in range(0, 900, 6):
        p = px[x, y]
        s += (p[0]+p[1]+p[2])/3
    rows.append(s/150)
# 输出差>8的行段
band = None
for y, v in enumerate(rows):
    if v > 8 and band is None: band = [y, y]
    elif v > 8: band[1] = y
    elif band:
        print(f'rows {band[0]}-{band[1]} avg-diff {max(rows[band[0]:band[1]+1]):.0f}')
        band = None
if band: print(f'rows {band[0]}-{band[1]} avg-diff {max(rows[band[0]:band[1]+1]):.0f}')
# 保存差热图
os.makedirs('/tmp/uc-crops', exist_ok=True)
diff.save(f'/tmp/uc-crops/{name}-diff.jpg', quality=70)
print('diff image: /tmp/uc-crops/%s-diff.jpg' % name)
