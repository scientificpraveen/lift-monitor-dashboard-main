FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_API_BASE=/api
ARG VITE_WS_PATH=/ws

# Set them as environment variables for the build
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_WS_PATH=$VITE_WS_PATH

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]