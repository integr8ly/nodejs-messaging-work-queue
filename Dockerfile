FROM node:10-alpine
ADD . ./messaging-app
WORKDIR ./messaging-app/frontend
RUN npm i

# Remove dev/build dependencies to reduce container size
RUN npm prune --production

CMD node .
