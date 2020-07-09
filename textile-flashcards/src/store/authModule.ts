import { RootState, AuthState, Deck } from '../types';
import { Libp2pCryptoIdentity, Identity } from '@textile/threads-core';

import { Client, ThreadID, UserAuth } from '@textile/hub';
import { ActionContext } from 'vuex';
import { deckSchema } from '../schemas';

import defaultDeck from '@/assets/defaultDeck.json';
import { Instance } from '@textile/threads-client';

// const SERVER_URL = process.env.VUE_APP_SERVER_URL;
const SOCKET_URL = process.env.VUE_APP_SOCKET_URL;
const TEXTILE_API = process.env.VUE_APP_TEXTILE_API;

// TS won't be able to find the type definitions for the state items here, but they will be available in components
// if for example you'd like to see the actions available on Client, you could

export default {
  namespaced: true as true,
  state: {
    id: null,
    idStr: null,
    userAuth: null,
    client: null,
    threadId: null,
    threadIdStr: null,
  } as AuthState,
  getters: {
    // message: state => `Hello, ${state.name}!`,
  },
  mutations: {
    ID(state: AuthState, id: Identity) {
      state.id = id;
    },
    ID_STR(state: AuthState, key: string) {
      state.idStr = key;
    },
    USER_AUTH(state: AuthState, userAuth: UserAuth) {
      state.userAuth = userAuth;
    },
    CLIENT(state: AuthState, client: Client) {
      state.client = client;
    },
    THREAD_ID(state: AuthState, threadId: ThreadID) {
      state.threadId = threadId;
    },
    THREAD_ID_STR(state: AuthState, threadIdStr: string) {
      state.threadIdStr = threadIdStr;
    },
  },
  actions: {
    async getOrCreateId({
      state,
      commit,
    }: ActionContext<AuthState, RootState>) {
      if (state.idStr) {
        console.log('state.idStr', state.idStr);
        console.log('state.id.public', state.id.public);
        if (!state.id.public) {
          console.log('---idstr but no id found');
          const id = await Libp2pCryptoIdentity.fromString(state.idStr);
          commit('ID', id);
        } else return state.id;
      } else {
        console.log('---no id found');
        const id = await Libp2pCryptoIdentity.fromRandom();
        const idStr = id.toString();
        commit('ID', id);
        commit('ID_STR', idStr);
      }
    },
    async loginWithChallenge({
      state,
      commit,
    }: ActionContext<AuthState, RootState>): Promise<UserAuth> {
      return new Promise((resolve, reject) => {
        /** Initialize our websocket connection */
        const socket = new WebSocket(SOCKET_URL);
        console.log('socket, SOCKET_URL', socket, SOCKET_URL);
        /** Wait for our socket to open successfully */
        socket.onopen = () => {
          /** Get public key string */
          const publicKey = state.id.public.toString();
          console.log('publicKey', publicKey);
          /** Send a new token request */
          socket.send(
            JSON.stringify({
              pubkey: publicKey,
              type: 'token',
            })
          );

          /** Listen for messages from the server */
          socket.onmessage = async (event) => {
            console.log('socket', socket);
            const data = JSON.parse(event.data);
            console.log('data', data);
            switch (data.type) {
              /** Error never happens :) */
              case 'error': {
                reject(data.value);
                break;
              }
              /** The server issued a new challenge */
              case 'challenge': {
                /** Convert the challenge json to a Buffer */
                const buf = Buffer.from(data.value);
                /** User our identity to sign the challenge */
                const credentials = await state.id.sign(buf);
                /** Send the signed challenge back to the server */
                socket.send(
                  JSON.stringify({
                    type: 'challenge',
                    sig: credentials.toJSON(),
                  })
                );
                break;
              }
              /** New token generated  */
              case 'token': {
                commit('USER_AUTH', data.value);
                resolve(data.value);
                break;
              }
            }
          };
        };
      });
    },
    async startClientWithAuth({
      state,
      commit,
      rootState,
    }: ActionContext<AuthState, RootState>) {
      const client = await Client.withUserAuth(state.userAuth, TEXTILE_API);
      commit('CLIENT', client);
      console.log('state.client', state.client);
      const token = await state.client.getToken(state.id);
      // console.log('token', token);
      commit('USER_AUTH', {
        ...state.userAuth,
        token: token,
      });
    },
    async getOrCreateThreadId({
      state,
      commit,
    }: ActionContext<AuthState, RootState>): Promise<ThreadID> {
      if (!state.threadIdStr) {
        console.log('---no thread ID found');
        const threadId = await ThreadID.fromRandom();
        commit('THREAD_ID', threadId);
        commit('THREAD_ID_STR', threadId.toString());
        return threadId;
      } else {
        try {
          state.threadId.toBytes();
        } catch (err) {
          console.log(err);
          console.log('state.threadIdStr', state.threadIdStr);
          console.log('---threadID incomplete');
          /**
           * Temporary hack to get ThreadID working with local storage
           * full ID gets distorted when saved and loses its functions
           */
          const threadId: ThreadID = await ThreadID.fromString(
            state.threadIdStr
          );
          commit('THREAD_ID', threadId);
          commit('THREAD_ID_STR', threadId.toString());
          return threadId;
        }
      }
    },
    async setUpListening({
      state,
      commit,
    }: ActionContext<AuthState, RootState>) {
      state.client.listen(
        state.threadId,
        [{ collectionName: 'Deck', instanceID: '123' }],
        (reply, err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('instance changed remotely', reply);
            if (reply) commit('decksMod/DECK', reply.instance, { root: true });
          }
        }
      );
    },
    async createDB({ state }: ActionContext<AuthState, RootState>) {
      // need to check if it exists first
      try {
        const preCheck = await state.client.getDBInfo(state.threadId);
        console.log('precheck', preCheck);
      } catch {
        console.log('---no DB found');
        await state.client.newDB(state.threadId, 'DB');
        const afterCheck = await state.client.getDBInfo(state.threadId);
        console.log('afterCheck', afterCheck);
      }
    },
    async getOrCreateDecksCollection({
      state,
    }: ActionContext<AuthState, RootState>) {
      try {
        await state.client.find(state.threadId, 'Deck', {});
      } catch {
        console.log(`---no 'Deck' collection found`);

        await state.client.newCollection(state.threadId, 'Deck', deckSchema);
      }
    },
    async createDeckInstances(
      { state, dispatch }: ActionContext<AuthState, RootState>,
      decks: Deck[]
    ) {
      const existingInstances = await dispatch('getAllDeckInstances');
      console.log('existingInstances', existingInstances);
      if (existingInstances.length === 0) {
        console.log('---no instances found');
        const createdDecks = await state.client.create(
          state.threadId,
          'Deck',
          decks // note that the third param needs to be an array
        ); // client.create() returns the deck _id //
        console.log('createdDecks', createdDecks);
      }
    },
    async getAllDeckInstances({ state }: ActionContext<AuthState, RootState>) {
      // Empty {} object to search all
      const response = await state.client.find(state.threadId, 'Deck', {});
      console.log('getAllDeckInstances response', response);
      return response.instancesList;
    },
    async initialize({
      state,
      commit,
      dispatch,
    }: ActionContext<AuthState, RootState>): Promise<Deck[]> {
      const startTime = new Date().getTime();
      let lastLog = new Date().getTime();
      function logTime(msg: string) {
        const now = new Date().getTime();
        console.log(
          `${msg} ----> from start: ${now - startTime} from last step: ${now -
            lastLog}`
        );
        lastLog = now;
      }

      await dispatch('getOrCreateId');
      logTime('getOrCreateId');
      await dispatch('loginWithChallenge');
      logTime('loginWithChallenge');
      await dispatch('startClientWithAuth');
      logTime('startClientWithAuth');
      await dispatch('getOrCreateThreadId');
      logTime('getOrCreateThreadId');
      await dispatch('setUpListening');
      logTime('setUpListening');
      await dispatch('createDB');
      logTime('createDB');
      await dispatch('getOrCreateDecksCollection', state.threadId);
      logTime('getOrCreateDecksCollection');
      await dispatch('createDeckInstances', [defaultDeck as Deck]);
      logTime('createDeckInstances(defaultDecks)');
      const decks = await dispatch('getAllDeckInstances');
      return decks;
    },
  },
};
