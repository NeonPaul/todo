<template>
  <form @submit="logIn">
    <input type="text" name="email" /><br />
    <input type="password" name="password" /><br />
    <input type="submit" value="Log in" />
  </form>
</template>

<script>
export default {
  methods: {
    logIn (e) {
      e.preventDefault()
      var data = {
        email: e.target.email.value,
        password: e.target.password.value
      }
      this.$emit('submit', data)
    }
  }
}
</script>
