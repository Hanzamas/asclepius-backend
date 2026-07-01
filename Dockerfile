# Build stage
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Copy model lokal (jika tidak pakai GCS)
# COPY model/ ./model/

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
