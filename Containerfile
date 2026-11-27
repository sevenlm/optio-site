# Lancer d’abord npm run fiches : technologies/ et tendances/ sont générés, pas versionnés.
FROM docker.io/library/busybox:musl
COPY index.html radar.html radar-des-dependances.html mentions-legales.html fiches.css robots.txt sitemap.xml google6121f93008f950b0.html /www/
COPY technologies/ /www/technologies/
COPY tendances/ /www/tendances/
COPY fonts/ /www/fonts/
COPY img/ /www/img/
COPY js/ /www/js/
COPY data/*.json /www/data/
EXPOSE 8080
USER 65534
CMD ["httpd", "-f", "-p", "8080", "-h", "/www"]
