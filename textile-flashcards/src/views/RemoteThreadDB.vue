<template>
  <div class="home">
    <section class="home__section editing-section">
      <deck-input
        class="editing-section__deck-input"
        @createDeck="createDeck"
      ></deck-input>
      <card-input
        class="editing-section__card-input"
        :selected-deck="state.selectedDeck"
        :decks="state.decks"
        @addCard="addCard"
        @changeSelectedDeck="changeSelectedDeck"
      ></card-input>
    </section>
    <section class="home__section display-section">
      <deck-display
        v-for="deck in state.decks"
        :key="deck.title"
        class="display-section__deck-display"
        :deck="deck"
        @deleteCard="deleteCard"
        @openEditor="openEditor"
      ></deck-display>
      <card-editor
        v-if="state.showEditor"
        class="display-section__card-editor"
        :edit-payload="state.editPayload"
        @cancelEdit="state.showEditor = false"
        @editCard="editCard"
      ></card-editor>
    </section>
  </div>
</template>

<script lang="ts">
// Built following the 'react-native-hub-app' in textile 'js-examples'
// It's not a practical use case because the textile hub user_group secret key is stored client-side
// It's also impractical because every change in the UI is waiting for changes in the remoteDB to finish and report back
// The Auth also expires very quickly

import { reactive } from '@vue/composition-api';

import {
  Deck,
  Card,
  NewCardPayload,
  DeleteCardPayload,
  EditCardPayload,
} from '../types';

import CardEditor from '@/components/CardEditor.vue';
import DeckInput from '@/components/DeckInput.vue';
import CardInput from '@/components/CardInput.vue';
import DeckDisplay from '@/components/DeckDisplay.vue';

import { v4 as uuid } from 'uuid';
import defaultDeck from '@/assets/defaultDeck.json';
import { deckSchema } from '../schemas';
import dotenv from 'dotenv';
import { Libp2pCryptoIdentity } from '@textile/threads-core';
import { Where } from '@textile/threads-client';
import { Buckets, Client, KeyInfo, ThreadID } from '@textile/hub';

export default {
  name: 'RemoteThreadDB',
  components: { CardInput, DeckDisplay, DeckInput, CardEditor },

  setup() {
    const state = reactive({
      decks: [] as Deck[],
      selectedDeck: '' as string,
      showEditor: false as boolean,
      editPayload: {} as EditCardPayload,
      id: null as Libp2pCryptoIdentity,
      idStr: null as string,
      threadId: null as ThreadID,
      client: null as Client,
      startTime: null as number,
      lastLog: null as number,
    });
    async function getOrCreateID(): Promise<Libp2pCryptoIdentity> {
      /**
       * Create a new user Identity
       *
       * The identity pk will be cached in AsyncStorage.
       * On the next session, the pk identity will be reused
       */
      // let idStr = store.state.auth.IDENTITY_KEY;
      if (state.idStr) {
        state.id = await Libp2pCryptoIdentity.fromString(state.idStr);
        // console.log('id Libp2pCryptoIdentity.fromString', id);
        return state.id;
      } else {
        /**
         * Create a new user Identity
         * The identity pk can be cached and reused
         */
        state.id = await Libp2pCryptoIdentity.fromRandom();
        // console.log('id Libp2pCryptoIdentity.fromRandom()', id);
        state.idStr = state.id.toString();
        // console.log('idStr', idStr);
        // store.commit.auth.setIdentityKey(idStr);
        return state.id;
      }
    }
    async function startClientWithAuth() {
      dotenv.config({ path: './.env.local' }); //if the .env file is not just .env, you need this config
      await getOrCreateID();
      /**
       * Authenticate the user with your User Key and Secret
       *
       * This will allow the user to store threads and buckets
       * using your developer resources on the Hub.
       *
       * Note: These keys should not be stored on the client side as in this example.
       */
      const keyInfo: KeyInfo = {
        key: process.env.VUE_APP_USER_API_KEY,
        secret: process.env.VUE_APP_USER_API_SECRET,
        type: 1,
      };
      /**
       * Auth our Database with admin info
       *
       * API calls will now include the credentials created above
       */
      state.client = await Client.withKeyInfo(keyInfo);
      /**
       * Generate an app user API token
       *
       * The app user (defined by Identity) needs an API token
       * The API will give you one based on ID plus Credentials
       *
       * The token will be added to the existing db.context.
       */
      const token = await state.client.getToken(state.id);
      console.log('token', token);
    }
    async function getOrCreateThreadId() {
      /**
       * All storage should be scoped to the identity
       *
       * If the identity changes and you try to use an old database,
       * it will error due to not authorized.
       */
      if (!state.threadId) {
        state.threadId = await ThreadID.fromRandom();
      }
    }
    async function createDB() {
      await state.client.newDB(state.threadId, 'myDB');
      const dbInfo = await state.client.getDBInfo(state.threadId);
      console.log('dbInfo', dbInfo);
      const threadsList = await state.client.listThreads();
      console.log('threadsList', threadsList);
    }
    async function getOrCreateDecksCollection(threadId: ThreadID) {
      const DeckCollection = await state.client.newCollection(
        threadId,
        'Deck',
        deckSchema
      );
      const collectionIndexes = await state.client.getCollectionIndexes(
        threadId,
        'Deck'
      );
      console.log('collectionIndexes', collectionIndexes);
    }
    async function createDeckInstances(decks: Deck[], threadId: ThreadID) {
      // Create a new instance of a Deck
      const createdDecks = await state.client.create(
        threadId,
        'Deck',
        decks // note that the third param needs to be an array
      ); // client.create() returns the deck _id // console.log(createdDecks);
      console.log('createdDecks', createdDecks);
    }
    async function getDeckByID(deckId: string) {
      // Search for an Instance with _id of 123 (the default deck's ID)
      const query = new Where('_id').eq(deckId);
      console.log('query', query);
      // response is an object {instancesList: [//array of matching instances]}
      const response = await state.client.find(state.threadId, 'Deck', query);
      // console.log('response', response);
      return response.instancesList[0];
    }
    async function getAllDeckInstances() {
      // Empty {} object to search all
      const response = await state.client.find(state.threadId, 'Deck', {});
      // console.log('response', response);
      return response.instancesList;
    }
    const logTime = (msg) => {
      const now = new Date().getTime();
      console.log(
        `${msg} ----> from start: ${now -
          state.startTime} from last step: ${now - state.lastLog}`
      );
      state.lastLog = now;
    };
    const initialize = async () => {
      state.startTime = new Date().getTime();
      state.lastLog = new Date().getTime();

      try {
        await getOrCreateID();
        logTime('getOrCreateID');
        await startClientWithAuth();
        logTime('startClientWithAuth');
        await getOrCreateThreadId();
        logTime('getOrCreateThreadId');
        await createDB();
        logTime('createDB');
        await getOrCreateDecksCollection(state.threadId);
        logTime('getOrCreateDecksCollection');
        await createDeckInstances([defaultDeck as Deck], state.threadId);
        logTime('createDeckInstances(defaultDecks)');

        const deck = await getDeckByID('123');
        console.log('deck', deck);
        state.decks = [deck];
        state.selectedDeck = deck.title;
        logTime('queryDecksCollection()');
      } catch (err) {
        console.log(err);
      }
    };

    initialize();
    const createDeck = async (deck: Deck) => {
      await createDeckInstances([deck], state.threadId);
      const updatedDecks = await getAllDeckInstances();
      console.log('updatedDecks', updatedDecks);
      state.decks = updatedDecks;
      state.selectedDeck = deck.title;
    };
    const addCard = async (payload: NewCardPayload) => {
      const newCard: Card = {
        _id: uuid(),
        frontText: payload.frontText,
        backText: payload.backText,
      };
      const decks = await getAllDeckInstances();
      for (const deck of decks) {
        if (deck.title === state.selectedDeck) {
          deck.cards.push(newCard);
          state.client.save(state.threadId, 'Deck', [deck]);
          const updatedDecks = await getAllDeckInstances();
          console.log('updatedDecks', updatedDecks);
          state.decks = updatedDecks;
          break;
        }
      }
    };
    const editCard = async (payload: EditCardPayload) => {
      const decks = await getAllDeckInstances();
      for (const deck of decks) {
        if (deck.title === payload.deckTitle) {
          for (const card of deck.cards) {
            if (card._id === payload._id) {
              card.frontText = payload.frontText;
              card.backText = payload.backText;
              state.client.save(state.threadId, 'Deck', [deck]);
              const updatedDecks = await getAllDeckInstances();
              console.log('updatedDecks', updatedDecks);
              state.decks = updatedDecks;
              break;
            }
          }
          break;
        }
      }
      state.showEditor = false;
    };
    const deleteCard = async (payload: DeleteCardPayload) => {
      const decks = await getAllDeckInstances();
      for (const deck of state.decks) {
        if (deck.title === payload.deckTitle) {
          for (const card of deck.cards) {
            if (card._id === payload._id) {
              deck.cards.splice(deck.cards.indexOf(card), 1);
              state.client.save(state.threadId, 'Deck', [deck]);
              const updatedDecks = await getAllDeckInstances();
              console.log('updatedDecks', updatedDecks);
              state.decks = updatedDecks;
              break;
            }
          }
          break;
        }
      }
    };
    const changeSelectedDeck = (title: string) => {
      state.selectedDeck = title;
    };
    const openEditor = (payload: EditCardPayload) => {
      state.editPayload = payload;
      state.showEditor = true;
    };
    return {
      state,
      createDeck,
      addCard,
      editCard,
      deleteCard,
      changeSelectedDeck,
      openEditor,
    };
  },
};
</script>
