<template>
  <div class="home">
    <section class="home__section editing-section">
      <deck-input class="editing-section__deck-input" @createDeck="createDeck"></deck-input>
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
import Vue from 'vue';

import { Deck, Card, NewCardPayload, DeleteCardPayload, EditCardPayload } from '@/types';

import CardEditor from '@/components/CardEditor.vue';
import DeckInput from '@/components/DeckInput.vue';
import CardInput from '@/components/CardInput.vue';
import DeckDisplay from '@/components/DeckDisplay.vue';

import { v4 as uuid } from 'uuid';
import defaultDeck from '@/assets/defaultDeck.json';
// Textile
import { Libp2pCryptoIdentity } from '@textile/threads-core';

export default Vue.extend({
  name: 'LocalThreadsDB',
  components: { CardInput, DeckDisplay, DeckInput, CardEditor },
  data() {
    return {
      decks: [defaultDeck as Deck],
      selectedDeck: '' as string,
      showEditor: false as boolean,
      editPayload: {} as EditCardPayload,
    };
  },
  methods: {
    createUserID: async function() {
      // Textile
      /** Random new identity */
      const identity = await Libp2pCryptoIdentity.fromRandom();
      /** Convert to string. */
      const identityString = identity.toString();
      this.saveIDtoLocal(identityString);
      return identity;
    },
    saveIDtoLocal: function(ID: string) {
      localStorage.setItem('user-private-identity', ID);
    },
    getIdentity: async function(): Promise<Libp2pCryptoIdentity> {
      /** Restore any cached user identity first */
      const cached = localStorage.getItem('user-private-identity');
      if (cached !== null) {
        /** Convert the cached identity string to a Libp2pCryptoIdentity and return */
        return Libp2pCryptoIdentity.fromString(cached);
      }
      /** No cached identity existed, so create a new one */
      return await this.createUserID();
    },
    initialize: function() {
      return null;
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
