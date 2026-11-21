# Site estático: o Caddy serve a pasta web/ na porta que a Railway define em $PORT.
FROM caddy:2-alpine
COPY web /srv
CMD caddy file-server --root /srv --listen :${PORT:-8080}
