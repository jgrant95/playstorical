FROM mcr.microsoft.com/azure-functions/node:4-node14-core-tools

ENV APPDIR /usr/src/playstorical-functions
RUN mkdir -p ${APPDIR}
WORKDIR ${APPDIR}

ENV AzureWebJobsScriptRoot=${APPDIR} \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY package.json .
COPY package-lock.json .

RUN npm install
RUN npm build

CMD ["npm", "start"]
