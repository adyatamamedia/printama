#!/bin/bash
# ==============================================================================
# SCRIPT OTOMATIS DEPLOY LANDING PAGE PRINTAMA (print.tama.my.id)
# ==============================================================================

# Warna output terminal
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}🚀 Memulai Pembaruan Landing Page Printama...${NC}"
echo -e "${CYAN}======================================================${NC}"

# 1. Pindah ke direktori tempat skrip berada
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# 2. Tarik pembaruan dari repository GitHub
echo -e "${YELLOW}📦 Menarik pembaruan dari repository GitHub...${NC}"
git fetch origin main
git reset --hard origin/main

if [ -d "landing" ]; then
    echo -e "${YELLOW}📂 Menyalin berkas landing ke folder utama...${NC}"
    cp -rf landing/* .
    cp -rf landing/.htaccess . 2>/dev/null
    rm -rf landing
fi

# 3. Atur hak akses file agar aman dan bisa dibaca Nginx/Web Server
echo -e "${YELLOW}🔒 Mengatur permission file & folder...${NC}"
find "$SCRIPT_DIR" -type d -exec chmod 755 {} \;
find "$SCRIPT_DIR" -type f -exec chmod 644 {} \;
chmod +x "$SCRIPT_DIR/deploy.sh" 2>/dev/null

# 4. Cek dan Reload Nginx jika perintah tersedia
if command -v nginx >/dev/null 2>&1; then
    echo -e "${YELLOW}🔄 Mengecek dan me-reload Nginx...${NC}"
    if sudo nginx -t 2>/dev/null; then
        sudo nginx -s reload 2>/dev/null || sudo systemctl reload nginx 2>/dev/null
        echo -e "${GREEN}✓ Nginx berhasil di-reload.${NC}"
    else
        echo -e "${YELLOW}⚠️  Konfigurasi Nginx tidak di-reload (memerlukan sudo atau cek nginx -t).${NC}"
    fi
fi

echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT BERHASIL!${NC}"
echo -e "${GREEN}🌐 Website: https://print.tama.my.id/${NC}"
echo -e "${GREEN}======================================================${NC}"
