FROM node:18

WORKDIR /app

# Install build dependencies untuk @tensorflow/tfjs-node
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
