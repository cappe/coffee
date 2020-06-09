FROM node:14 AS base
WORKDIR /home/node
COPY package*.json ./

FROM base AS dev
ENV NODE_ENV=development
RUN npm install
COPY . .
CMD npm start

FROM base AS prod
ENV NODE_ENV=production
RUN npm install --only=prod
COPY . .
CMD npm start
