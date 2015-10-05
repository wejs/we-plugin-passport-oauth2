# We.js bearer token plugin

> Authenticate with tokens, use for your single page app

## Installation

With npm: 

```sh
npm install we-plugin-passport-bearer
```

## Configuration

> we-plugin-passport-bearer is plug and play!

## API

Post url to send user `email` and `password` to receive a valid token:

    'post /auth/login-for-token': {
      controller    : 'passportToken',
      action        : 'loginForGetToken',
      responseType  : 'json'
    }

Then send the token in Authorization header as Bearer token:

```
Àuthorization=Bearer [token string]
```

## Links

> * We.js site: http://wejs.org

## License
MIT