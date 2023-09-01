## Dockerfile

FROM node:16-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=development && npm cache clean --force

COPY . .

RUN npm run build && npm prune --production

FROM node:16-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production && npm cache clean --force

COPY --from=development /usr/src/app/build ./build

CMD ["node", "build/index.js"]
