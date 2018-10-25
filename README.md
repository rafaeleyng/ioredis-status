# redis-healthcheck

Checks the health of a Redis server.

This project is a shameless copy+paste form [redis-status](https://github.com/mixmaxhq/redis-status), but adapted to work with `ioredis` clients as well.

Instead of passing the connection config (like in `redis-status`), in `redis-healthcheck` you pass a previously created client, an instance of [ioredis](https://github.com/luin/ioredis) or [node_redis](https://github.com/NodeRedis/node_redis).

Using `ioredis`, this works both for single Redis deployments and for Sentinel as well.


## installation

```sh
npm install --save redis-healthcheck
```

or

```sh
yarn add redis-healthcheck
```

## usage

```javascript
const Redis = require('ioredis')
const RedisHealthcheck = require('redis-healthcheck')

const config = { /* host, port, password, ... */ }
const client = new Redis(config)

const redisHealthcheck = RedisHealthcheck({
  client,
  name: 'my redis', // any name you want to see in the error messages
  memoryThreshold: 10485760, // in bytes, used to report abnormal memory usage
})

redisHealthcheck.checkStatus((err) => {
  // the callback is called with a string as `err` in case of failure, or undefined in case of success
})
```
