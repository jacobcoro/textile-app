/** Provides nodejs access to a global Websocket value, required by Hub API */
(global as any).WebSocket = require('isomorphic-ws');

import koa from 'koa';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import websockify from 'koa-websocket';
import passport from 'passport';
import User from './models/user';
const cors = require('@koa/cors');

import { wssLogin } from './wss';
import router from './routes';
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

const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(User.authenticate()));
app.use(passport.initialize());
app.use(passport.session());

//
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(router.routes());
app.use(router.allowedMethods());

/**
 * Create Websocket endpoint for client-side token challenge
 *
 * See ./wss.ts
 */
app.ws.use(wssLogin);

/** Start the server! */
app.listen(PORT, () => console.log(`Koa server listening on PORT ${PORT}`));
