# We.js oauth2 authentication plugin with suport to bearer token

> Authenticate with bearer tokens, use for your single page app

## Installation

With npm: 

```sh
npm install we-plugin-passport-oauth2
```

## Configuration

> we-plugin-passport-oauth2-client is plug and play by default but you can override default settings

For all avaible settings see: https://github.com/wejs/we-plugin-passport-oauth2/blob/master/plugin.js#L10

## API

Post url to send user `email` and `password` to receive a valid token:

    'post /auth/login-for-token': {
      controller    : 'passportToken',
      action        : 'loginForGetToken',
      responseType  : 'json'
    }

Then send the token from your client side application in Authorization header as Bearer token:

```
Àuthorization=Bearer [token string]
```

## Links

> * We.js site: http://wejs.org

## License
MIT