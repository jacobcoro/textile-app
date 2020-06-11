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
// Followiing textile js-examples: react-native-threads-app

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
// Textile
import { schema } from '../schemas.js';
// import { Libp2pCryptoIdentity } from '@textile/threads-core';
import { Client, Where } from '@textile/threads-client';
import { ThreadID } from '@textile/threads-id';

export default Vue.extend({
  name: 'LocalThreadsDB',
  components: { CardInput, DeckDisplay, DeckInput, CardEditor },
  data() {
    return {
      decks: [defaultDeck as Deck],
      selectedDeck: '' as string,
      showEditor: false as boolean,
      editPayload: {} as EditCardPayload,
      threadId: '' as string,
      client: null as Client,
    };
  },
  mounted() {
    this.initialize();
  },
  methods: {
    createDBWithRandomThread: async function() {
      // Create a new ThreadID to use as our dbID
      const threadId = ThreadID.fromRandom();
      console.log(threadId);
      // Fire up a new Client
      const client = new Client();
      console.log(client);
      // Create a new DB with the ID we already generated
      await client.newDB(threadId); // fails here with error Error: Session or API key required
      console.log(client);
    },
    createDecksCollection: async function() {
      // Create a new collection with the Deck schema
      await this.client.newCollection(this.threadId, 'Deck', schema.deck);
      // Create a new instance of a Deck
      const decks = await this.client.create(
        this.threadId,
        'Deck',
        this.decks[0]
      );
      console.log(decks);
    },
    queryDecksCollection: async function() {
      // Search for an Instance with _id of 123 (the default deck's ID)
      const query = new Where('_id').eq('123');
      const response = await this.client.find(this.threadId, 'Deck', query);
      console.log(response);
    },
    initialize: async function() {
      await this.createDBWithRandomThread();
      await this.createDecksCollection();
      await this.queryDecksCollection();
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
