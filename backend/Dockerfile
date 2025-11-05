# Use official Node.js runtime as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY smart-contracts/package*.json ./smart-contracts/

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates and create app user
RUN apk update && apk upgrade && \
    addgroup -g 1001 -S nodejs && \
    adduser -S swiftsplit -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/smart-contracts ./smart-contracts

# Copy necessary configuration files
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/health-check.js ./health-check.js

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R swiftsplit:nodejs /app

# Switch to non-root user
USER swiftsplit

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node health-check.js

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["node", "src/server.js"]