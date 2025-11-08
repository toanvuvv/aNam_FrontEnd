FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Railway sẽ tự động route traffic đến port mà ứng dụng đang listen
# Expose port (Railway sẽ tự động detect port thực tế từ biến môi trường PORT)
EXPOSE 8080

# Start vite preview server với port từ biến môi trường PORT (Railway set PORT=8080)
CMD sh -c "npm run preview -- --host 0.0.0.0 --port ${PORT:-8080}"

