import { Identity } from '@textile/threads-core';
import { Client, ThreadID, UserAuth } from '@textile/hub';

export interface Card {
  _id: string;
  frontText: string;
  backText: string;
}
export interface Deck {
  _id: string;
  cards: Card[];
  title: string;
}
export interface NewCardPayload {
  frontText: string;
  backText: string;
  deckTitle: string;
}

export interface EditCardPayload {
  frontText: string;
  backText: string;
  deckTitle: string;
  _id: string;
}
export interface DeleteCardPayload {
  _id: string;
  deckTitle: string;
}
export interface AuthState {
  id: Identity;
  idStr: string;
  userAuth: UserAuth;
  client: Client;
  threadId: ThreadID;
  threadIdStr: string;
}
export interface DecksState {
  decks: Deck[];
}
export interface RootState {
  authMod: AuthState;
  decksMod: DecksState;
}
