FROM node:20-alpine

RUN mkdir -p /usr/src/node-app && chown -R node:node /usr/src/node-app

WORKDIR /usr/src/node-app

COPY package.json yarn.lock* package-lock.json* ./

USER node

RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile --production; \
    elif [ -f package-lock.json ]; then npm ci --only=production; \
    else npm install --only=production; fi

COPY --chown=node:node . .

EXPOSE 3000

CMD ["node", "src/index.js"]
