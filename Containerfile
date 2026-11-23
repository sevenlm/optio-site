FROM docker.io/library/busybox:musl
COPY index.html radar.html robots.txt sitemap.xml /www/
COPY fonts/ /www/fonts/
COPY js/ /www/js/
COPY data/*.json /www/data/
EXPOSE 8080
USER 65534
CMD ["httpd", "-f", "-p", "8080", "-h", "/www"]
