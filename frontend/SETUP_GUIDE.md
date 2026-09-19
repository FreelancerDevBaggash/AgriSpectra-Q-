# 🚀 دليل التثبيت والتشغيل السريع

## المتطلبات الأساسية

- Node.js 20+ أو 22+
- npm 10+
- Python 3.9+ (للـ Backend)

## التثبيت

### 1. تثبيت مكتبات Frontend

```bash
cd frontend
npm install
```

**ملاحظة:** التثبيت قد يستغرق 2-3 دقائق في المرة الأولى.

### 2. تشغيل Backend (Flask API)

في terminal منفصل:

```bash
# من المجلد الرئيسي
python live_matrix_api.py
```

سيعمل Backend على: `http://localhost:8765`

### 3. تشغيل Frontend (Next.js)

```bash
cd frontend
npm run dev
```

سيعمل Frontend على: `http://localhost:3000`

## 🧪 التجربة

1. افتح المتصفح على: http://localhost:3000
2. انقر على "Run Live Analysis"
3. اختر Scene (مثلاً: scene_03)
4. انقر "Start Analysis"
5. شاهد النتائج والخرائط

## 📝 ملاحظات مهمة

### إذا واجهت مشكلة في التثبيت

```bash
# امسح cache وأعد التثبيت
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### إذا Backend لا يعمل

تأكد من:
- ✅ Python مثبت
- ✅ مكتبات Python مثبتة (flask, rasterio, numpy, etc.)
- ✅ البيانات موجودة في المسار الصحيح

### تغيير عنوان Backend

في ملف `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8765
```

## 🏗️ البناء للإنتاج

```bash
# Build
npm run build

# Start production server
npm start
```

## 🐳 Docker (قريباً)

```dockerfile
# سيتم إضافة Dockerfile قريباً
```

## ❓ مشاكل شائعة

### خطأ: Cannot find module 'next'

```bash
npm install
```

### خطأ: MapLibre GL CSS not found

تأكد من أن `@import 'maplibre-gl/dist/maplibre-gl.css';` موجود في `globals.css`

### خطأ: API connection refused

تأكد من تشغيل Backend على port 8765

---

**للمساعدة:** راجع README.md أو تواصل مع الفريق
