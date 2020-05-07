<template>
  <div class="home">
    <div id="card-input">
      <h3>create a card</h3>
      <p>front</p>
      <input v-model="frontText" type="text" />
      <p>back</p>
      <input v-model="backText" type="text" />
      <button @click="addCard()">add card</button>
    </div>
    <div id="card-display">
      <vue-flashcard
        v-for="card in cards"
        :key="card.id"
        front="card.front_text"
        back="card.back_text"
      >
      </vue-flashcard>
    </div>
  </div>
</template>

<script>
import vueFlashcard from 'vue-flashcard';
import { Database } from '@textile/threads-database';
const uuidv4 = require('uuid/v4');
const initOptions = {
  dispatcher: null,
  eventBus: null,
  network: null,
  identity: null,
  token: null,
};
export default {
  name: 'Home',
  components: { vueFlashcard },
  data() {
    return {
      frontText: '',
      backText: '',
      cards: [],
      client: null,
      store: null,
    };
  },
  created() {
    this.startup();
  },
  methods: {
    startup: async function() {
      // tried this with ..., nothing, and initOptions, all gave errors
      const db = new Database(initOptions);
      const Collection = await db.newCollectionFromObject('Players', {
        ID: '',
        team: '',
        name: '',
        points: 0,
      });

      // This will listen to any and all event types on Players
      db.on('Players.**', update => {
        console.log(update);
      });
      const Players = new Collection('players', {}); // Anything goes schema
      await Players.insert(
        { ID: '', points: 11, team: 'Astronauts', name: 'beth' },
        { ID: '', points: 1, team: 'Astronauts', name: 'jim' },
        { ID: '', points: 18, team: 'Astronauts', name: 'issac' },
        { ID: '', points: 7, team: 'Astronauts', name: 'beth' }
      );

      const all = Players.find(
        { $or: [{ points: { $gt: 10 } }, { name: 'jim' }] },
        { sort: { points: -1 } }
      );
      for await (const { key, value } of all) {
        console.log(key, value);
      }
    },
    loadCards: async function() {
      const found = await this.client.modelFind(this.store.id, 'Card', {});
      this.cards = found.entitiesList;
      // .map(entity => entity)
      // .map(obj => {
      //   return new TodoItem(obj);
      // });
    },
    addCard: async function() {
      const card = { id: uuidv4(), front_text: this.frontText, back_text: this.backText };
      const created = await this.client.modelCreate(this.store.id, 'Card', [card]);
      this.cards = created.entitiesList;
    },
  },
};
</script>
<style scoped>
.home {
  text-align: center;
  max-width: 400px;
  margin: auto;
  display: flex;
  flex-direction: column;
}
br {
  height: 20px;
}
</style>
