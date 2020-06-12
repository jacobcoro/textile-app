<template>
  <div class="home">
    <section class="home__section editing-section">
      <deck-input
        class="editing-section__deck-input"
        @createDeck="createDeck"
      ></deck-input>
      <card-input
        class="editing-section__card-input"
        :selected-deck="selectedDeck"
        :decks="decks"
        @addCard="addCard"
        @changeSelectedDeck="changeSelectedDeck"
      ></card-input>
    </section>
    <section class="home__section display-section">
      <deck-display
        v-for="deck in decks"
        :key="deck.title"
        class="display-section__deck-display"
        :deck="deck"
        @deleteCard="deleteCard"
        @openEditor="openEditor"
      ></deck-display>
      <card-editor
        v-if="showEditor"
        class="display-section__card-editor"
        :edit-payload="editPayload"
        @cancelEdit="showEditor = false"
        @editCard="editCard"
      ></card-editor>
    </section>
  </div>
</template>

<script lang="ts">
// Followiing textile js-examples: hub-browser-auth-app, simpleAuth

import Vue from 'vue';

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
import { deckSchema } from '../schemas.js';
import { Client, Context, UserAuth } from '@textile/textile';
import { Where } from '@textile/threads-client';

import { Libp2pCryptoIdentity } from '@textile/threads-core';
import { ThreadID } from '@textile/threads-id';

const serverUrl = process.env.VUE_APP_SERVER_URL;
export default Vue.extend({
  name: 'SimpleAuth',
  components: { CardInput, DeckDisplay, DeckInput, CardEditor },
  data() {
    return {
      decks: [] as Deck[],
      selectedDeck: '' as string,
      showEditor: false as boolean,
      editPayload: {} as EditCardPayload,
      id: null as Libp2pCryptoIdentity,
      idStr: null as string,
      userAuth: null as UserAuth,
      context: null as Context,
      client: null as Client,
      threadId: null as string,
      start: null as number,
      lastLog: null as number,
    };
  },
  created() {
    this.initialize();
  },
  methods: {
    logTime: function(msg) {
      const now = new Date().getTime();
      console.log(
        `${msg} ----> from start: ${now - this.start} from last step: ${now -
          this.lastLog}`
      );
      this.lastLog = now;
    },
    initialize: async function() {
      this.lastLog = new Date().getTime();
      this.start = new Date().getTime();
      /** Create or get identity */
      this.id = await this.getOrCreateIdentity();
      this.logTime('getOrCreateIdentity()');
      this.userAuth = await this.createCredentials();
      // console.log('this.userAuth', this.userAuth);
      /** Store the access control metadata */
      this.context = Context.fromUserAuth(this.userAuth);
      this.logTime('Context.fromUserAuth(this.userAuth)');
      /** The simple auth endpoint doesn't provide a user's Hub API Token */
      this.client = new Client(this.context);
      this.logTime('new Client(this.context)');
      const token = await this.client.getToken(this.id);
      this.logTime('client.getToken(this.id)');

      /** Update our context, including the token */
      this.userAuth = {
        ...this.userAuth,
        token: token,
      };
      this.context = Context.fromUserAuth(this.userAuth);
      this.logTime('Context.fromUserAuth(this.userAuth)');

      // Create a new ThreadID to use as our dbID
      this.threadId = ThreadID.fromRandom();
      this.logTime('ThreadID.fromRandom()');
      await this.client.newDB(this.threadId);
      this.logTime('client.newDB(this.threadId)');

      // Create a new collection with the Deck schema
      this.decksCollection = await this.client.newCollection(
        this.threadId,
        'Deck',
        deckSchema
      );
      this.logTime('this.client.newCollection(deckCollection)');
      await this.createDeckInstances([defaultDeck]);
      this.logTime('createDeckInstances([defaultDeck])');
      this.decks = await this.queryDecksCollection();
      this.logTime('queryDecksCollection()');
    },
    getOrCreateIdentity: async function() {
      if (this.id) {
        return this.id;
      } else {
        const id = await Libp2pCryptoIdentity.fromRandom();
        this.id = id;
        return id;
      }
    },
    createCredentials: async function<UserAuth>() {
      const response = await fetch(`${serverUrl}/api/credentials`, {
        method: 'GET',
      });
      const userAuth = await response.json();
      this.logTime('fetch(`${serverUrl}/api/credentials`');
      return userAuth;
    },
    createDeckInstances: async function(decks: Deck[]) {
      // Create a new instance of a Deck
      const createdDecks = await this.client.create(
        this.threadId,
        'Deck',
        decks // note that the third param needs to be an array
      ); // client.create() returns the deck _id // console.log(createdDecks);
    },
    queryDecksCollection: async function() {
      // Search for an Instance with _id of 123 (the default deck's ID)
      const query = new Where('_id').eq('123');
      // response is an object {instancesList: [//array of matching instances]}
      const response = await this.client.find(this.threadId, 'Deck', query);
      // console.log(response);
      return response.instancesList;
    },
    createDeck: function(deck: Deck) {
      this.decks.push(deck);
      this.selectedDeck = deck.title;
    },
    addCard: function(payload: NewCardPayload) {
      const newCard: Card = {
        _id: uuid(),
        frontText: payload.frontText,
        backText: payload.backText,
      };
      for (const deck of this.decks) {
        if (deck.title === this.selectedDeck) {
          deck.cards.push(newCard);
          break;
        }
      }
    },
    editCard: function(payload: EditCardPayload) {
      for (const deck of this.decks) {
        if (deck.title === payload.deckTitle) {
          for (const card of deck.cards) {
            if (card._id === payload._id) {
              card.frontText = payload.frontText;
              card.backText = payload.backText;
              break;
            }
          }
          break;
        }
      }
      this.showEditor = false;
    },
    deleteCard: function(payload: DeleteCardPayload) {
      for (const deck of this.decks) {
        if (deck.title === payload.deckTitle) {
          for (const card of deck.cards) {
            if (card._id === payload._id) {
              deck.cards.splice(deck.cards.indexOf(card), 1);
              break;
            }
          }
          break;
        }
      }
    },
    changeSelectedDeck: function(title: string) {
      this.selectedDeck = title;
    },
    openEditor: function(payload: EditCardPayload) {
      this.editPayload = payload;
      this.showEditor = true;
    },
  },
});
</script>
