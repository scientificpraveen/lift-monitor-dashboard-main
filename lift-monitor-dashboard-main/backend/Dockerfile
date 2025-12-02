FROM node:20-alpine
# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

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