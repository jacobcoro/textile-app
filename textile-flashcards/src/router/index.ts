import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import CompositionCRUD from '../views/CompositionCRUD.vue';
import RemoteThreadDB from '../views/RemoteThreadDB.vue';
import LocalThreadDB from '../views/LocalThreadDB.vue';
import SimpleAuth from '../views/SimpleAuth.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'CompositionCRUD',
    component: CompositionCRUD,
  },
  {
    path: '/CompositionCRUD',
    name: 'CompositionCRUD',
    component: CompositionCRUD,
  },
  {
    path: '/RemoteThreadDB',
    name: 'RemoteThreadDB',
    component: RemoteThreadDB,
  },
  {
    path: '/LocalThreadDB',
    name: 'LocalThreadDB',
    component: LocalThreadDB,
  },
  {
    path: '/SimpleAuth',
    name: 'SimpleAuth',
    component: SimpleAuth,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
