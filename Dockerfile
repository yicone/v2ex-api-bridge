FROM node:8
LABEL Name=web Version=0.0.2

ENV TZ="Asia/Shanghai"
ENV PORT 80

RUN npm config set registry https://registry.npm.taobao.org

ADD package.json yarn.lock /tmp/
RUN cd /tmp && yarn install
RUN mkdir -p /usr/src/app && mv /tmp/node_modules /usr/src
WORKDIR /usr/src/app
COPY . /usr/src/app

CMD npm start