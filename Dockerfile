FROM ghcr.io/linuxserver/baseimage-alpine:3.18-bd2a5b02-ls10
LABEL org.opencontainers.image.source="https://github.com/cyb3rgh05t/docker-uploader"

ARG TARGETPLATFORM
ARG BUILDPLATFORM

ARG ALPINE_VERSION=3.18-bd2a5b02-ls10

RUN \
  echo "**** update packages ****" && \
  apk --quiet --no-cache --no-progress update && \
  apk --quiet --no-cache --no-progress upgrade && \
  echo "**** install build packages ****" && \
  apk add -U --update --no-cache bash ca-certificates shadow musl findutils linux-headers coreutils apk-tools busybox && \
  echo "*** cleanup system ****" && \
  apk del --quiet --clean-protected --no-progress && \
  rm -f /var/cache/apk/*

COPY ./root/ /

COPY release.json /var/www/html/release.json

RUN chown abc:abc /var/www/html/release.json && chmod 644 /var/www/html/release.json

ENTRYPOINT /init
##EOF
