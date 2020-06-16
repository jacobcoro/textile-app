<template>
  <div class="app u-scroller">
    <div class="app__nav nav">
      <router-link class="nav__link" to="/CompositionCRUD"
        >0: Vanilla CRUD</router-link
      >
      <router-link class="nav__link" to="/RemoteThreadDB"
        >1: RemoteThreadDB</router-link
      >
      <router-link class="nav__link" to="/LocalThreadDB"
        >2: LocalThreadDB</router-link
      >
      <router-link class="nav__link" to="/SimpleAuth"
        >3: SimpleAuth</router-link
      >
      <router-link class="nav__link" to="/ChallengeAuth"
        >4: ChallengeAuth</router-link
      >
      <router-link class="nav__link" to="/PersistedCredentials"
        >5: PersistedCredentials</router-link
      >
    </div>
    <router-view class="app_router-view" />
  </div>
</template>

<style lang="scss">
@import './styles/main.scss';
// Blocks should only be concerned with internal positioning like (eg. padding).
// Position of the whole block (eg. margin) should rely on parent (.app__nav nav)
.nav {
  padding: 5px 0px;
  text-align: center;
  width: 100%;
  background-color: $secondary;
  &__link {
    font-weight: bold;
    color: white;
    padding: 5px 10px;
    &.router-link-exact-active {
      color: $primary;
    }
  }
}
</style>
