FROM node:14

WORKDIR /home/node

COPY package*.json ./
RUN npm install --only=prod

COPY . .

CMD npm start
