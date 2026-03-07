FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install --production
COPY . /app
RUN npx prisma generate
EXPOSE 4000
ENV NODE_ENV=production
CMD ["sh","-c","npx prisma migrate deploy && node src/server.js"]
