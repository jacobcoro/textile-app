<template>
  <div class="home">
    <h3 v-if="signingUp">Sign up</h3>
    <h3 v-if="!signingUp">Log in</h3>

    <p>username</p>
    <input type="text" />
    <p>password</p>
    <input type="text" />
    <br />
    <button @click="submit()">Submit</button>
    <button v-if="signingUp" @click="signingUp = !signingUp">Log in</button>
    <button v-if="!signingUp" @click="signingUp = !signingUp">Sign up</button>
  </div>
</template>

<script>
export default {
  name: 'Home',
  components: {},
  data() {
    return {
      signingUp: true,
      username: '',
      password: '',
    };
  },
  methods: {
    submit() {
      if (this.signingUp) this.signup();
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
