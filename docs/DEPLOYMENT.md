# Deployment Guide

CourierOS is built with React 19, Vite, Express, and Tailwind CSS v4. It can be deployed as a static client app or containerized full-stack service on Cloud Run / Vercel / Netlify.

---

## 🐳 Docker Deployment

### 1. Build Docker Image
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

### 2. Run Container
```bash
docker build -t courieros .
docker run -p 3000:3000 courieros
```

---

## ☁️ Cloud Run Deployment

```bash
gcloud run deploy courieros \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
