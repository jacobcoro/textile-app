import Vue from 'vue';
import Vuex, { Payload, Store } from 'vuex';
import { createDirectStore } from 'direct-vuex';
import VuexPersistence from 'vuex-persist';
import Cookies from 'js-cookie';
import localForage from 'localforage';

import { RootState } from '../types';
import authModule from './authModule';
import decksModule from './decksModule';

// need to use local forage if we want to store ID as an object with methods, and not stringified.
// right now we are using cookies for the authmod, which is why we need to rehydrate the id and thread id from strings every time
// if we used local forage for the authmod we could just store the IDs themselves.

const vuexLocalForage = new VuexPersistence<RootState>({
  key: process.env.VUE_APP_STORAGE_KEY,
  storage: localForage,
  reducer: (state) => ({ decksMod: state.decksMod }), // only save decks module
  // undocumented bug in vuex-persist with localforage. Hacky fix from issues forum
  asyncStorage: true,
});
// const vuexLocalStorage = new VuexPersistence<RootState>({
//   storage: window.localStorage,
//   reducer: (state) => ({ decksMod: state.decksMod }), // only save decks module
//   // filter: mutation => mutation.type == 'addNavItem',
// });
const vuexCookie = new VuexPersistence<RootState>({
  restoreState: (key, storage) => Cookies.getJSON(key),
  saveState: (key, state, storage) =>
    Cookies.set(key, state, {
      expires: 3,
    }) as any,
  modules: ['authMod'], //only save user module
  // filter: mutation => mutation.type == 'logIn' || mutation.type == 'logOut',
});

Vue.use(Vuex);

const {
  store,
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
} = createDirectStore({
  modules: {
    authMod: authModule,
    decksMod: decksModule,
  },
  plugins: [
    vuexLocalForage.plugin,
    // vuexLocalStorage.plugin,
    vuexCookie.plugin,
  ],
});

// Export the direct-store instead of the classic Vuex store.
export default store;

// The following exports will be used to enable types in the
// implementation of actions and getters.
export {
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
};

// The following lines enable types in the injected store '$store'.
export type AppStore = typeof store;
declare module 'vuex' {
  interface Store<S> {
    direct: AppStore;
  }
}
