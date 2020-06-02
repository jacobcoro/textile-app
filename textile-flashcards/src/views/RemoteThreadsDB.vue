<template>
  <div class="home">
    <h1>Remote Threads DB</h1>
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
import { Deck, Card, NewCardPayload, DeleteCardPayload } from '@/types';
import store from '../store';
import { Client, Where } from '@textile/threads-client';
import { ThreadID } from '@textile/threads-id';
import { Buckets, Context } from '@textile/textile';
import { Libp2pCryptoIdentity } from '@textile/threads-core';
import DeckInput from '@/components/DeckInput.vue';
import CardInput from '@/components/CardInput.vue';
import DeckDisplay from '@/components/DeckDisplay.vue';
import { v4 as uuid } from 'uuid';

export default {
  name: 'RemoteThreadsDB',
  components: { CardInput, DeckDisplay, DeckInput },
  data() {
    return {
      decks: [{ cards: [] as Card[], title: 'Default Deck' }] as Deck[],
      selectedDeck: 'Default Deck' as string,
    };
  },
  created() {
    this.startup();
  },
  methods: {
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
        id: uuid(),
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
            if (card.id === payload.cardId) deck.cards.splice(deck.cards.indexOf(card), 1);
          }
        }
        break;
      }
    },
    startup: async function() {
      this.generateIdentity();
    },
    async generateIdentity(): Promise<Libp2pCryptoIdentity> {
      let idStr = store.state.auth.IDENTITY_KEY;
      if (idStr) {
        const id = await Libp2pCryptoIdentity.fromString(idStr);
        console.log('id Libp2pCryptoIdentity.fromString', id);
        return id;
      } else {
        const id = await Libp2pCryptoIdentity.fromRandom();
        console.log('id Libp2pCryptoIdentity.fromRandom()', id);
        idStr = id.toString();
        console.log('idStr', idStr);
        store.commit.auth.setIdentityKey(idStr);
        return id;
      }
    },
    async getUserToken(id: Libp2pCryptoIdentity, db: Client): Promise<string> {
      // const persistenceKey = `${id.toString()}-${TOKEN_KEY}`;
      let token = store.state.auth.persistenceKey;
      if (token) {
        /**
         * We need to update our connection context with the exising token
         */
        db.context.withToken(token);
        return token;
      }
      /**
       * The token will automatically be added to the DB context when running getToken
       */
      token = await db.getToken(id);
      store.commit.auth.setPersistenceKey(token);
      // await AsyncStorage.setItem(persistenceKey, token);
      return token;
    },
    loadCards: async function() {
      // const found = await this.client.modelFind(this.store.id, 'Card', {});
      // this.cards = found.entitiesList;
      // .map(entity => entity)
      // .map(obj => {
      //   return new TodoItem(obj);
      // });
    },
  },
};
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
