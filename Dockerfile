FROM node:23-alpine

RUN mkdir /app
WORKDIR /app

COPY ./ /app

RUN npm install --production