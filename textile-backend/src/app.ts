/** Provides nodejs access to a global Websocket value, required by Hub API */
(global as any).WebSocket = require('isomorphic-ws');
/** Import our server libraries */
import koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';

/** For using values in our .env */
import dotenv from 'dotenv';

/** Textile libraries */
import { Client } from '@textile/threads-client';
import { Libp2pCryptoIdentity } from '@textile/threads-core';

/** Read the values of .env into the environment */
dotenv.config({ path: './.env.local' });

/** Port our server will run on */
const app = new koa();
const router = new Router();

router.get('/', (ctx: koa.Context) => {
    ctx.body = 'Hello World';
});

app.use(router.routes());

export = app;
