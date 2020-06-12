<template>
  <div class="home">
    <section id="editing-section">
      <deck-input
        :selected-deck="selectedDeck"
        :decks="decks"
        @createDeck="createDeck"
        @changeSelectedDeck="changeSelectedDeck"
      ></deck-input>
      <card-input @addCard="addCard"></card-input>
    </section>
    <hr style="margin: 25px 0;" />
    <section id="display-section">
      <deck-display
        v-for="deck in decks"
        :key="deck.title"
        :deck="deck"
        @deleteCard="deleteCard"
      ></deck-display>
    </section>
  </div>
</template>

<script lang="ts">
// Followiing textile js-examples: react-native-hub-app
import Vue from 'vue';
import { Deck, Card, NewCardPayload, DeleteCardPayload } from '../types';
// import store from '../store';
import DeckInput from '@/components/DeckInput.vue';
import CardInput from '@/components/CardInput.vue';
import DeckDisplay from '@/components/DeckDisplay.vue';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

import { Client, Where } from '@textile/threads-client';
import { ThreadID } from '@textile/threads-id';
import { Buckets, Context } from '@textile/textile';
import { Libp2pCryptoIdentity } from '@textile/threads-core';

export default Vue.extend({
  name: 'RemoteThreadsDB',
  components: { CardInput, DeckDisplay, DeckInput },
  data() {
    return {
      decks: [{ cards: [] as Card[], title: 'Default Deck' }] as Deck[],
      selectedDeck: 'Default Deck' as string,
      id: null as Libp2pCryptoIdentity,
      idStr: null as string,
      contextStr: null as string,
      contextToken: null as string,
      db: null as Client,
    };
  },
  created() {
    this.initialize();
  },
  methods: {
    initialize: async function() {
      dotenv.config({ path: './.env.local' }); //if the .env file is not just .env, you need this config

      await this.getOrCreateID();
      await this.getOrCreateContext();
    },
    getOrCreateID: async function(): Promise<Libp2pCryptoIdentity> {
      let idStr = this.idStr;
      // let idStr = store.state.auth.IDENTITY_KEY;
      if (idStr) {
        const id = await Libp2pCryptoIdentity.fromString(idStr);
        console.log('id Libp2pCryptoIdentity.fromString', id);
        this.idStr = idStr;
        this.id = id;
        return id;
      } else {
        /**
         * Create a new user Identity
         *
         * The identity pk can be cached and reused be reused
         */
        const id = await Libp2pCryptoIdentity.fromRandom();
        console.log('id Libp2pCryptoIdentity.fromRandom()', id);
        idStr = id.toString();
        console.log('idStr', idStr);
        this.idStr = idStr;
        this.id = id;
        // store.commit.auth.setIdentityKey(idStr);
        return id;
      }
    },
    checkCachedContext: function(idStr: string) {
      // console.log('this.contextStr', this.contextStr);
      if (this.contextStr) {
        const ctxJson = JSON.parse(this.contextStr);
        // console.log('ctxJson', ctxJson);
        if (
          ctxJson['x-textile-api-sig-msg'] &&
          Date.parse(ctxJson['x-textile-api-sig-msg']) > new Date().getTime()
        ) {
          // Not expired
          const ctx = Context.fromJSON(ctxJson);
          return ctx;
        }
      }
      return null;
    },
    getOrCreateContext: async function() {
      /**
       * Context contains the token and session information
       *
       * If possible, we'll reuse an existing session.
       * If it doesn't exist or is expired, we'll create a new one.
       */
      const validCtx = await this.checkCachedContext();
      if (validCtx) {
        this.db = new Client(validCtx);
      } else {
        /**
         * Create a new Context
         */
        const ctx = new Context();
        /**
         * Authenticate the user with your User_group Key and Secret
         *
         * This will allow the user to store threads and buckets
         * using your developer resources on the Hub.
         * note this is not an individual user's key, but your user_group key
         */
        // console.log(
        //   'process.env.VUE_APP_USER_API_KEY',
        //   process.env.VUE_APP_USER_API_KEY
        // );
        // await ctx.withUserKey({
        //   key: process.env.VUE_APP_USER_API_KEY,
        //   secret: process.env.VUE_APP_USER_API_SECRET,
        //   type: 1,
        // });
        await ctx.withAPIKey(process.env.VUE_APP_USER_API_KEY);
        // console.log('ctx', ctx);

        /**
         * Update our Database context
         *
         * API calls will now include the credentials created above
         */
        this.db = new Client(ctx);
        // console.log('this.db', this.db);
        /**getTokenChallenge
         * Generate an app user API token
         *
         * The app user (defined by Identity) needs an API token
         * The API will give you one based on ID plus Credentials
         *
         * The token will be added to the existing db.context.
         */
        let token = this.contextToken;
        if (!token) {
          /**
           * The token will automatically be added to the DB context when running getToken
           */
          // should be full id, not idstr
          // console.log('this.id', this.id);
          token = await this.db.getToken(this.id);
          this.contextToken = token;
          // console.log('token', token);
        }
        /** Append the token to our Context */
        ctx.withToken(token);
        // console.log('ctx.withToken', ctx);
        /**
         * The Context is reusable in future app sessions, so we store it.
         */
        this.contextStr = JSON.stringify(ctx.toJSON());
      }
    },
    createThread() {
      return null;
    },
    loadCards: async function() {
      // const found = await this.client.modelFind(this.store.id, 'Card', {});
      // this.cards = found.entitiesList;
      // .map(entity => entity)
      // .map(obj => {
      //   return new TodoItem(obj);
      // });
    },
    createDeck: function(deck: Deck) {
      console.log(deck);
      this.decks.push(deck);
    },
    changeSelectedDeck: function(title: string) {
      this.selectedDeck = title;
    },
    addCard: function(payload: NewCardPayload) {
      console.log(payload);
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
      // const created = await this.client.modelCreate(this.store.id, 'Card', [card]);
      // this.cards = created.entitiesList;
    },
    deleteCard: function(payload: DeleteCardPayload) {
      for (const deck of this.decks) {
        if (deck.title === payload.deckTitle) {
          for (const card of deck.cards) {
            if (card.id === payload._id)
              deck.cards.splice(deck.cards.indexOf(card), 1);
          }
        }
        break;
      }
    },
  },
});
</script>
<style>
#editing-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
#display-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
</style>
