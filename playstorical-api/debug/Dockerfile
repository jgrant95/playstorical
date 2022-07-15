FROM node:16-slim

ENV APPDIR /usr/src/playstorical-api
RUN mkdir -p ${APPDIR}
WORKDIR ${APPDIR}

COPY package.json .
COPY package-lock.json .

RUN npm install

ENV PORT 80
EXPOSE 80

CMD ["npm", "start"]
