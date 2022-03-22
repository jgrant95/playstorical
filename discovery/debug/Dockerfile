FROM node:16-slim

ENV APPDIR /usr/src/discovery

RUN mkdir -p ${APPDIR}

WORKDIR ${APPDIR}

COPY package.json .
COPY package-lock.json .

RUN npm install

CMD ["npm", "start"]
