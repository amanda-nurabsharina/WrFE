# Build Stage
FROM node:22-alpine AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_APP_NAME
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV CYPRESS_INSTALL_BINARY=0
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=512" npx vite build --sourcemap false

# Production Stage (Nginx)
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
