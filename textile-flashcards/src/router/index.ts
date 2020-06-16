import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import store from '../store';

import CompositionCRUD from '../views/CompositionCRUD.vue';
import RemoteThreadDB from '../views/RemoteThreadDB.vue';
import LocalThreadDB from '../views/LocalThreadDB.vue';
import SimpleAuth from '../views/SimpleAuth.vue';
import ChallengeAuth from '../views/ChallengeAuth.vue';
import PersistedCredentials from '../views/PersistedCredentials.vue';
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
  {
    path: '/ChallengeAuth',
    name: 'ChallengeAuth',
    component: ChallengeAuth,
  },
  {
    path: '/PersistedCredentials',
    name: 'PersistedCredentials',
    component: PersistedCredentials,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});
const waitForStorageToBeReady = async (
  to: any,
  from: any,
  next: () => void
) => {
  // undocumented bug in vuex-persist with localforage. Hacky fix from issues forum
  await ((store as unknown) as { restored: Promise<unknown> }).restored;
  next();
};
router.beforeEach(waitForStorageToBeReady);
export default router;
