# Use Node.js 20 LTS Alpine for small image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install production and dev dependencies for build
RUN npm ci

# Copy application source code
COPY . .

# Build frontend production bundle with Vite
RUN npm run build

# Expose server port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "server.js"]
