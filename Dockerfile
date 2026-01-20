# Use a lightweight web server
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy your portfolio files to nginx folder
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80
