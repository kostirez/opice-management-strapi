# Base image
FROM node:18

# Working directory
WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy rest of the files
COPY . .

# Build TypeScript -> JavaScript
RUN npm run build

# Expose Strapi port
EXPOSE 1337

# Start app
CMD ["npm", "run", "start"]
