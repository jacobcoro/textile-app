/** Import our server libraries */
import koa from 'koa';
import Router from 'koa-router';
import { getAPISig } from '../hub-helpers';
import User from '../models/user';

/**
 * Start API Routes
 *
 * All prefixed with `/api/`
 */
const routes = new Router({
    prefix: '/api',
});

/**
 * Create a REST API endpoint at /api/auth
 *
 * This endpoint will provide authorization for _any_ user.
 */
routes.get('/credentials', async (ctx: koa.Context, next: () => Promise<any>) => {
    /** Get API authorization for the user */
    const auth = await getAPISig();

    /** Include the token in the auth payload */
    const credentials = {
        ...auth,
        key: process.env.USER_API_KEY,
    };

    /** Return the auth in a JSON object */
    ctx.body = credentials;

    await next();
});
/**
 * user auth for password login
 */
routes.get('/user', async (ctx: koa.Context, next: () => Promise<any>) => {
    const allUsers = User.find({});
    console.log(allUsers);
    ctx.body = allUsers;
    await next();
});

routes.post('/login', async (ctx: koa.Context, next: () => Promise<any>) => {
    const Users = new User({ email: ctx.request.body.email, username: ctx.request.body.username });
    User.register(Users, ctx.request.body.password, function (err, user) {
        if (err) {
            ctx.body = { success: false, message: 'Your account could not be saved. Error: ', err };
        } else {
            ctx.body = { success: true, message: 'Your account has been saved' };
        }
    });
    await next();
});

export default routes;
