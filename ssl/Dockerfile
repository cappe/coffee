FROM nginx:latest AS base
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV SSL_KEY /etc/ssl/private/nginx.pem
ENV SSL_CRT /etc/ssl/certs/nginx.pem

FROM base AS dev
RUN openssl req -x509 -nodes -days 3650 \
    -subj "/C=CA/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    -newkey rsa:2048 -keyout ${SSL_KEY} -out ${SSL_CRT}

FROM base AS prod
