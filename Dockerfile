FROM node:14-stretch

RUN mkdir /app
WORKDIR /app

COPY package.json /app
RUN npm install

COPY . /app
