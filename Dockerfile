# Use official Node.js image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all the source code
COPY . .

# Expose the application port
EXPOSE 3000

# Command to run the app
CMD ["npm", "run", "start:dev"]
