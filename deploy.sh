#!/bin/bash
# ============================================================
# AgriSpectra-Q — سكريبت النشر على السيرفر
# المفتاح: ~/.ssh/altayseer  (التيسير)
# الاستخدام:
#   chmod +x deploy.sh
#   ./deploy.sh <SERVER_IP> [demo|production|both]
# ============================================================

set -e

# ── الإعدادات ──────────────────────────────────────────────
SERVER_IP="${1:?خطأ: مرر IP السيرفر كأول معامل}"
MODE="${2:-both}"          # demo | production | both
SSH_KEY="$HOME/.ssh/altayseer"
REMOTE_USER="root"         # غيّره إذا كان المستخدم مختلفاً (ubuntu, deploy, ...)
REMOTE_DIR="/opt/agrispectra"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=accept-new"

echo "🚀 بدء النشر → $SERVER_IP  (وضع: $MODE)"
echo "   المفتاح: $SSH_KEY"
echo "   المجلد على السيرفر: $REMOTE_DIR"
echo "---------------------------------------------------"

# ── 1. التحقق من وجود المفتاح ─────────────────────────────
if [[ ! -f "$SSH_KEY" ]]; then
  echo "❌ المفتاح غير موجود: $SSH_KEY"
  echo "   ضع مفتاح التيسير الخاص في ~/.ssh/altayseer"
  echo "   ثم نفّذ: chmod 600 ~/.ssh/altayseer"
  exit 1
fi
chmod 600 "$SSH_KEY"

# ── 2. رفع ملفات المشروع (بدون node_modules و .next و data) ─
echo "📦 رفع ملفات المشروع..."
rsync -avz --progress \
  -e "ssh $SSH_OPTS" \
  --exclude='.git' \
  --exclude='frontend/.next' \
  --exclude='frontend/node_modules' \
  --exclude='data/raw' \
  --exclude='results/live_matrix/**/*.tif' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.env.local' \
  ./ "$REMOTE_USER@$SERVER_IP:$REMOTE_DIR/"

echo "✅ تم رفع الملفات"

# ── 3. تثبيت البيئة على السيرفر ────────────────────────────
echo "⚙️  تثبيت البيئة على السيرفر..."
ssh $SSH_OPTS "$REMOTE_USER@$SERVER_IP" bash << REMOTE_SCRIPT
set -e
cd $REMOTE_DIR

# Python venv
if [ ! -d "venv" ]; then
  echo "→ إنشاء Python virtual environment..."
  python3 -m venv venv
fi

# تثبيت المكتبات حسب الوضع
if [[ "$MODE" == "demo" || "$MODE" == "both" ]]; then
  echo "→ تثبيت مكتبات Demo API..."
  ./venv/bin/pip install --quiet flask flask-cors
fi

if [[ "$MODE" == "production" || "$MODE" == "both" ]]; then
  echo "→ تثبيت مكتبات Production API (قد يستغرق وقتاً)..."
  ./venv/bin/pip install --quiet -r backend/requirements.txt
fi

echo "✅ تمت التثبيت"
REMOTE_SCRIPT

# ── 4. نسخ ملفات systemd و nginx على السيرفر ──────────────
echo "📋 نسخ إعدادات systemd و nginx..."
scp $SSH_OPTS \
  server-config/agrispectra-demo.service \
  server-config/agrispectra-prod.service \
  "$REMOTE_USER@$SERVER_IP:/tmp/"

scp $SSH_OPTS \
  server-config/nginx-agrispectra.conf \
  "$REMOTE_USER@$SERVER_IP:/tmp/"

# ── 5. تفعيل الخدمات على السيرفر ───────────────────────────
echo "🔧 تفعيل الخدمات..."
ssh $SSH_OPTS "$REMOTE_USER@$SERVER_IP" bash << REMOTE_SCRIPT
set -e

# systemd services
cp /tmp/agrispectra-demo.service    /etc/systemd/system/
cp /tmp/agrispectra-prod.service    /etc/systemd/system/
cp /tmp/nginx-agrispectra.conf      /etc/nginx/sites-available/agrispectra

ln -sf /etc/nginx/sites-available/agrispectra \
        /etc/nginx/sites-enabled/agrispectra 2>/dev/null || true

systemctl daemon-reload

if [[ "$MODE" == "demo" || "$MODE" == "both" ]]; then
  systemctl enable  agrispectra-demo
  systemctl restart agrispectra-demo
  echo "✅ Demo API شغّال على :8765"
fi

if [[ "$MODE" == "production" || "$MODE" == "both" ]]; then
  systemctl enable  agrispectra-prod
  systemctl restart agrispectra-prod
  echo "✅ Production API شغّال على :8766"
fi

nginx -t && systemctl reload nginx
echo "✅ Nginx تم إعادة تحميله"
REMOTE_SCRIPT

echo ""
echo "=============================================="
echo "✅ النشر اكتمل بنجاح!"
echo "----------------------------------------------"
echo "  Demo API      → https://api.agrispectra.com"
echo "  Production API → https://prod.agrispectra.com"
echo "  Frontend       → https://agrispectra.vercel.app (Vercel)"
echo "=============================================="
echo ""
echo "⚡ تحقق من الحالة:"
echo "  curl https://api.agrispectra.com/api/status"
echo "  curl https://prod.agrispectra.com/api/status"
