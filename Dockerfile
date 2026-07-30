# Stage 1: Build Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Unified Container (Node + Nginx Reverse Proxy)
FROM node:20-alpine
RUN apk add --no-cache nginx supervisor
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 80 5001

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
