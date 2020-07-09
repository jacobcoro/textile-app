# textile-app

## A simple flashcard app to test out textile.io

built following the [documentation](https://docs.textile.io/tutorials/hub/web-app/) for textile.io and the [examples repo](https://github.com/textileio/js-examples)

## Front-end

front-end is a vue app build with this [sandbox template](https://github.com/Jewcub/sandbox-flashcard-app-vue)

Views in project using which part of the Textile examples:

- LocalThreadsDB: from [react-native-threads-app](https://github.com/textileio/js-examples/tree/master/react-native-threads-app)
- RemoteThreadsDB: from [react-native-hub-app](https://github.com/textileio/js-examples/tree/master/react-native-hub-app)

view README for build and test info

## Back-end

built with koa, based on the textile docs above and specifically [this example](https://github.com/textileio/js-examples/tree/master/hub-browser-auth-app)

view README for build and test info

## to run full project

using docker build strategy from [this article](https://hackernoon.com/a-better-way-to-develop-node-js-with-docker-cd29d3a0093)

```bash
make setup
make install
make dev
```
