# Get baseline nginx image
FROM nginx:alpine

# remove all files within nginx/conf.d/ directory
RUN rm /etc/nginx/conf.d/*

# copy over our nginx configuration into nginx/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf