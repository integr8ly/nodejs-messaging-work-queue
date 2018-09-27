FROM node:10-alpine

ADD . ./messaging-app

WORKDIR ./messaging-app/frontend

RUN npm i

CMD ["node", "."]
