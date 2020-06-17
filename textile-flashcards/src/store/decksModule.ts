import {
  DecksState,
  Deck,
  NewCardPayload,
  DeleteCardPayload,
  EditCardPayload,
  Card,
  RootState,
} from '../types';
import { v4 as uuid } from 'uuid';
import authModule from './authModule';
import { ActionContext } from 'vuex';

export default {
  namespaced: true as true,
  state: {
    decks: [] as Deck[],
  } as DecksState,
  getters: {
    decks: (state: DecksState) => state.decks,
  },
  actions: {
    async getAllDeckInstances({
      state,
      rootState,
    }: ActionContext<DecksState, RootState>) {
      const response = await rootState.authMod.client.find(
        rootState.authMod.threadId,
        'Deck',
        {}
      );
      console.log('getAllDeckInstances response', response);
      return response.instancesList;
    },
    async ADD_DECK(
      { dispatch, commit, rootState }: ActionContext<DecksState, RootState>,
      deck: Deck
    ) {
      const createdDecks = await rootState.authMod.client.create(
        rootState.authMod.threadId,
        'Deck',
        [deck]
      );
      const updatedDecks = await dispatch('getAllDeckInstances');
      console.log('updatedDecks', updatedDecks);
      commit('DECKS', updatedDecks);
    },
    async ADD_CARD(
      {
        dispatch,
        commit,
        state,
        rootState,
      }: ActionContext<DecksState, RootState>,
      payload: NewCardPayload
    ) {
      const newCard: Card = {
        _id: uuid(),
        frontText: payload.frontText,
        backText: payload.backText,
      };
      for (const deck of state.decks) {
        if (deck.title === payload.deckTitle) {
          deck.cards.push(newCard);
          await rootState.authMod.client.save(
            rootState.authMod.threadId,
            'Deck',
            [deck]
          );
          const updatedDecks = await dispatch('getAllDeckInstances');
          console.log('updatedDecks', updatedDecks);
          commit('DECKS', updatedDecks);
          break;
        }
      }
    },
    async EDIT_CARD(
      {
        dispatch,
        commit,
        rootState,
        state,
      }: ActionContext<DecksState, RootState>,
      payload: EditCardPayload
    ) {
      for (const deck of state.decks) {
        if (deck.title === payload.deckTitle) {
          for (const card of deck.cards) {
            if (card._id === payload._id) {
              card.frontText = payload.frontText;
              card.backText = payload.backText;
              await rootState.authMod.client.save(
                rootState.authMod.threadId,
                'Deck',
                [deck]
              );
              const updatedDecks = await dispatch('getAllDeckInstances');
              console.log('updatedDecks', updatedDecks);
              commit('DECKS', updatedDecks);
              break;
            }
          }
          break;
        }
      }
    },
    async DELETE_CARD(
      {
        dispatch,
        commit,
        rootState,
        state,
      }: ActionContext<DecksState, RootState>,
      payload: DeleteCardPayload
    ) {
      for (const deck of state.decks) {
        if (deck.title === payload.deckTitle) {
          for (const card of deck.cards) {
            if (card._id === payload._id) {
              deck.cards.splice(deck.cards.indexOf(card), 1);
              rootState.authMod.client.save(
                rootState.authMod.threadId,
                'Deck',
                [deck]
              );
              const updatedDecks = await dispatch('getAllDeckInstances');
              console.log('updatedDecks', updatedDecks);
              commit('DECKS', updatedDecks);
              break;
            }
          }
          break;
        }
      }
    },
  },
  mutations: {
    DECKS(state: DecksState, decks: Deck[]) {
      state.decks = decks;
    },
    DECK(state: DecksState, deck: Deck) {
      for (const existingDeck of state.decks) {
        if (existingDeck._id == deck._id) {
          existingDeck.cards = deck.cards;
        }
      }
    },
    // Although these are quicker, they have all been moved to actions to insure textile works.
    ADD_DECK(state: DecksState, deck: Deck) {
      state.decks.push(deck);
    },
    ADD_CARD(state: DecksState, payload: NewCardPayload) {
      const newCard: Card = {
        _id: uuid(),
        frontText: payload.frontText,
        backText: payload.backText,
      };
      for (const deck of state.decks) {
        if (deck.title === payload.deckTitle) {
          deck.cards.push(newCard);
          break;
        }
      }
    },
    DELETE_CARD(state: DecksState, payload: DeleteCardPayload) {
      for (const deck of state.decks) {
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
    EDIT_CARD(state: DecksState, payload: EditCardPayload) {
      for (const deck of state.decks) {
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
    },
  },
};
