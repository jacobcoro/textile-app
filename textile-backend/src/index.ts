/** Provides nodejs access to a global Websocket value, required by Hub API */
(global as any).WebSocket = require('isomorphic-ws');

import koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import websockify from 'koa-websocket';
const cors = require('@koa/cors');

import { createReadStream } from 'fs';

import { wssLogin } from './wss';
import api from './api';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' }); //if the .env file is not just .env, you need this config

if (!process.env.USER_API_KEY || !process.env.USER_API_SECRET) {
    console.log('keys not found, shutting down');
    process.exit(1);
}

const PORT = parseInt(process.env.PORT, 10) || 3000;

const app = websockify(new koa());

/** Middlewares */
app.use(cors());
app.use(json());
app.use(logger());
app.use(bodyParser());

/**
 * Start HTTP Routes
 */
const router = new Router();
app.use(router.routes()).use(router.allowedMethods());

/**
 * Serve index.html
 */
router.get('/', async (ctx: koa.Context, next: () => Promise<any>) => {
    ctx.type = 'text/html; charset=utf-8';
    ctx.body = createReadStream(__dirname + '/../client/index.html');
    await next();
});

/**
 * Create Rest endpoint for server-side token issue
 *
 * See ./api.ts
 */
app.use(api.routes());
app.use(api.allowedMethods());

/**
 * Create Websocket endpoint for client-side token challenge
 *
 * See ./wss.ts
 */
app.ws.use(wssLogin);

/** Start the server! */
app.listen(PORT, () => console.log(`Koa server listening on PORT ${PORT}`));
