# 1. Use Node.js 20 LTS as base image
FROM node:20

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package.json & package-lock.json
COPY package*.json ./

# 4. Install dependencies inside container
RUN npm install

# 5. Copy all source code
COPY . .

# 6. Compile TypeScript to JS
RUN npm run build

# 7. Expose port 4000
EXPOSE 4000

# 8. Run the server
CMD ["npm", "start"]
