#!/bin/zsh
# 华为高校人才平台 demo · 一键启动
# 用法: ./start.sh          （构建前端 + 启动 API+静态托管）
#      ./start.sh dev       （不构建，直接启动 API；前端另跑 npm run dev）
set -e
cd "$(dirname "$0")"

if [ "$1" != "dev" ]; then
  echo "==> 构建前端..."
  (cd web && npm install --no-audit --no-fund >/dev/null 2>&1 || true; npm run build)
fi

echo "==> 安装后端依赖并启动（端口 3001）..."
(cd server && npm install --no-audit --no-fund >/dev/null 2>&1 || true; npm start)
