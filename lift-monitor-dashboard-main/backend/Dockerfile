FROM node:20-alpine

# Install Chromium/Puppeteer dependencies for WhatsApp Headless along with OpenSSL for Prisma
RUN apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Verify prisma schema exists
RUN test -f prisma/schema.prisma || (echo "Prisma schema not found!" && exit 1)

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health',(r) => {if (r.statusCode!==200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]