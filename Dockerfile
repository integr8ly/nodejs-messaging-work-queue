FROM node:10-alpine
ADD . ./messaging-app
WORKDIR ./messaging-app/frontend
RUN npm i
EXPOSE 8080
# Remove dev/build dependencies to reduce container size
RUN npm prune --production
USER 1001
CMD node .
