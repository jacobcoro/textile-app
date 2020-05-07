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
import API from '@textile/textile';
import { Client } from '@textile/threads-client';
const uuidv4 = require('uuid/v4');

const cardSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#', // Always use this.
  $id: 'https://example.com/card.schema.json', // https://json-schema.org/learn/getting-started-step-by-step.html
  title: 'Card',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'The cards id.',
    },
    front_text: {
      type: 'string',
      description: 'The text on the front.',
    },
    back_text: {
      type: 'string',
      description: 'The text on the back.',
    },
  },
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
      // generating random device/userID for testing.
      const deviceId = uuidv4();
      // Hard-coded for demo purposes
      const userToken = '54e24fc3-fda5-478a-b1f7-040ea5aaab33';
      // initialize Textile Hub API:
      const hubApi = new API({
        token: userToken,
        deviceId,
      });
      await hubApi.start();
      // initialize Textile Client:
      this.client = new Client(hubApi.threadsConfig);
      // initialize store(db):
      this.store = await this.client.newStore();
      // register schema/model in the store:
      await this.client.registerSchema(this.store.id, 'Card', cardSchema);
      // start store:
      await this.client.start(this.store.id);
    },
    async loadCards() {
      const found = await this.client.modelFind(this.store.id, 'Card', {});
      this.cards = found.entitiesList;
      // .map(entity => entity)
      // .map(obj => {
      //   return new TodoItem(obj);
      // });
    },
    async addCard() {
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
