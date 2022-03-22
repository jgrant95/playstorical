FROM mcr.microsoft.com/azure-functions/node:3.0-appservice

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

WORKDIR /home/site/wwwroot

COPY package.json .
COPY package-lock.json .
COPY local.settings.json .

RUN npm install

CMD ["npm", "start"]
