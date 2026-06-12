FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_APP_TIMEZONE=Asia/Makassar
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_TIMEZONE=$VITE_APP_TIMEZONE

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
