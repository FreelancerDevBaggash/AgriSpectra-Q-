# AgriSpectra-Q Frontend

🌾 **Hyperspectral Crop Intelligence Platform** - Built for Arab Youth Space Hackathon 2026

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework:** Next.js 15.1.6 (App Router)
- **UI:** React 19 + TypeScript 5.7
- **Styling:** Tailwind CSS 3.4
- **Maps:** MapLibre GL JS 5.0 + react-map-gl
- **Charts:** Recharts 2.15
- **Icons:** Lucide React
- **Geospatial:** GeoTIFF, Turf.js

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx        # Home page
│   │   ├── intelligence/   # Analysis page
│   │   ├── results/        # Results dashboard
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── Navigation.tsx
│   │   ├── Map/           # Map components
│   │   ├── Charts/        # Data visualization
│   │   └── UI/            # Reusable UI components
│   ├── lib/               # Utilities and helpers
│   │   ├── api.ts        # API client
│   │   ├── types.ts      # TypeScript types
│   │   └── utils.ts      # Helper functions
│   └── styles/
│       └── globals.css   # Global styles
├── public/               # Static assets
├── package.json
└── tsconfig.json
```

## 🔗 Backend Integration

The frontend connects to the Flask API backend:

```typescript
// Default: http://localhost:8765
NEXT_PUBLIC_API_URL=http://localhost:8765
```

## 📝 Features

✅ Interactive EnMAP scene selection
✅ Live Matrix analysis execution
✅ Geospatial results visualization
✅ Priority zone ranking
✅ Spectral evidence display
✅ Inspection budget analysis
✅ Responsive design (mobile-ready)

## 🌍 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 📄 License

MIT License - Built for Space Academy Hackathon 2026

## 🤝 Contributing

This project is part of the Arab Youth Space Hackathon 2026.

---

**Built with 💚 for sustainable agriculture in the Arab region**
