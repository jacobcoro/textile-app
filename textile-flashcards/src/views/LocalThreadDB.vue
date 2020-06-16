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
// this is not working as of yet because it requires a local threads deamon running (which is written in go)

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
// import dotenv from 'dotenv';
import {
  Identity,
  Libp2pCryptoIdentity,
  ThreadID,
} from '@textile/threads-core';
// import { Where } from '@textile/threads-db';
// import { Buckets, Client, KeyInfo, ThreadID } from '@textile/hub';

import { Database, JSONSchema, Collection } from '@textile/threads-database';
import { collect } from 'streaming-iterables';
export default {
  name: 'LocalThreadDB',
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
      db: null as Database,
      Deck: null as Collection,
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
    async function startDbWithId() {
      state.db = new Database('myDB'); //fails here with error: connection refused
      await state.db.start(state.id);
      const dbInfo = await state.db.getInfo();
      console.log('dbInfo', dbInfo);
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
    async function getOrCreateDecksCollection(threadId: ThreadID) {
      let entries = await state.db.collections.entries();
      let values = await state.db.collections.values();
      let collectionNames = [];
      let collectionContents = [];
      await state.db.collections.forEach((collection) => {
        collectionNames.push(collection.name);
        collectionContents.push(collection.find({}));
      });
      console.log(
        'entries, values, collectionNames, collectionContents',
        entries,
        values,
        collectionNames,
        collectionContents
      );
      state.Deck = await state.db.newCollection(
        'Deck',
        deckSchema as JSONSchema
      );
      entries = await state.db.collections.entries();
      values = await state.db.collections.values();
      collectionNames = [];
      collectionContents = [];
      await state.db.collections.forEach((collection) => {
        collectionNames.push(collection.name);
        collectionContents.push(collection.find({}));
      });
      console.log(
        'entries, values, collectionNames, collectionContents',
        entries,
        values,
        collectionNames,
        collectionContents
      );
    }
    async function createDeckInstances(decks: Deck[]) {
      const NewDeck: Collection = new state.Deck(defaultDeck); // Not yet persisted
      await NewDeck.save(); // Persist changes to db

      console.log('DefaultDeck', NewDeck);
    }
    async function getDeckByID(deckId: string) {
      const response = await state.Deck.findById(deckId);
      console.log('response', response);
      return response;
    }
    async function getAllDeckInstances() {
      // Empty {} object to search all
      const response: Deck[] = await state.Deck.find({});
      console.log('response', response);
      return response;
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
        await startDbWithId();
        logTime('startDbWithId');
        await getOrCreateThreadId();
        logTime('getOrCreateThreadId');
        await getOrCreateDecksCollection(state.threadId);
        logTime('getOrCreateDecksCollection');
        await createDeckInstances([defaultDeck as Deck]);
        logTime('createDeckInstances(defaultDecks)');

        // const deck = await getDeckByID('123');
        // console.log('deck', deck);
        // state.decks = [deck];
        // state.selectedDeck = deck.title;
        // logTime('queryDecksCollection()');
      } catch (err) {
        console.log(err);
      }
    };

    initialize();
    const createDeck = async (deck: Deck) => {
      await createDeckInstances([deck]);
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
          // state.db.save(state.threadId, 'Deck', [deck]);
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
              // state.db.save(state.threadId, 'Deck', [deck]);
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
              // state.db.save(state.threadId, 'Deck', [deck]);
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
