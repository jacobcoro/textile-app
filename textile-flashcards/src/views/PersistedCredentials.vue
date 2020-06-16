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
        v-for="deck in decks"
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
// A more realistic example, where login info is persisted and the auth functions are abstracted to the vuex
// see authModule.ts
// Based on textile js-examples: hub-browser-auth-app, index.html (authentication with challenge)

import { reactive, computed } from '@vue/composition-api';

import {
  Deck,
  NewCardPayload,
  DeleteCardPayload,
  EditCardPayload,
} from '../types';

import store from '../store';

import CardEditor from '@/components/CardEditor.vue';
import DeckInput from '@/components/DeckInput.vue';
import CardInput from '@/components/CardInput.vue';
import DeckDisplay from '@/components/DeckDisplay.vue';

export default {
  name: 'PersistedCredentials',
  components: { CardInput, DeckDisplay, DeckInput, CardEditor },
  setup() {
    store.dispatch.authMod.initialize().then((decks) => {
      store.commit.decksMod.DECKS(decks);
    });
    const decks = computed(() => {
      return store.getters.decksMod.decks;
    });
    const state = reactive({
      selectedDeck:
        decks && decks.value.length > 0
          ? (decks.value[0].title as string)
          : ('' as string),
      showEditor: false as boolean,
      editPayload: {} as EditCardPayload,
    });

    const createDeck = (deck: Deck) => {
      store.dispatch.decksMod.ADD_DECK(deck);
      state.selectedDeck = deck.title;
    };
    const addCard = (payload: NewCardPayload) => {
      payload.deckTitle = state.selectedDeck;
      store.dispatch.decksMod.ADD_CARD(payload);
    };
    const editCard = (payload: EditCardPayload) => {
      store.dispatch.decksMod.EDIT_CARD(payload);
      state.showEditor = false;
    };
    const deleteCard = (payload: DeleteCardPayload) => {
      store.dispatch.decksMod.DELETE_CARD(payload);
    };
    const changeSelectedDeck = (title: string) => {
      state.selectedDeck = title;
    };
    const openEditor = (payload: EditCardPayload) => {
      state.editPayload = payload;
      state.showEditor = true;
    };

    return {
      decks,
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
