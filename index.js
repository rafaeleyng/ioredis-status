/**
 * Creates a `RedisStatus` object configured to check the status of the specified Redis server.
 *
 * @param {object} config
 *    @property {string} name - An arbitrary name for the server, included in error messages.
 *    @property {object} client - ioredis or node_redis client instance.
 *    @property {number=} memoryThreshold - (Optional) The maximum amount of memory which the Redis
 *      server is expected to use when healthy:
 *        - If you use Redis as an LRU cache, set this to the value of the server's `maxmemory`
 *          configuration directive.
 *        - If you use Redis for pub/sub, set this (via observation) to the amount of memory used by
 *          the server 's runtime operations (most likely something like 10MB).
 *        - Leave this unset if your Redis deployment is autoscaled.
 *      Defaults to none.
 */
function RedisStatus(config) {
  if (!(this instanceof RedisStatus)) {
    return new RedisStatus(config)
  }

  this.client = config.client
  this.name = config.name
  this.memoryThreshold = config.memoryThreshold
}

/**
 * Checks the status of the Redis server.
 *
 * The server is considered healthy if:
 *    - it is reachable;
 *    - and if the server is using less memory than is specified by this object's memory threshold
 *      (if a threshold was specified when this object was created).
 *
 * @param {function<string=>} callback - A function to call with the status: `undefined` if the
 *    server is healthy, or a string describing the reason that the server is unhealthy.
 */
RedisStatus.prototype.checkStatus = function checkStatus(callback) {
  const redisClient = this.client

  const closingCallback = (...params) => {
    redisClient.quit()
    callback(...params)
  }

  // Ensure that our Redis instance is responsive.
  redisClient.ping((pingErr, pong) => {
    if (pingErr || (pong !== 'PONG')) {
      closingCallback(`${this.name} Redis instance is not responsive.`)
      return
    }

    if (!this.memoryThreshold) {
      closingCallback() // Success.
    } else {
      redisClient.info('memory', (err, info) => {
        if (err) {
          closingCallback(`${this.name} Redis instance is not responsive.`)
          return
        }

        // '# Memory\r\nused_memory:1086352…' -> ['# Memory', 'used_memory:1086352'] ->
        // 'used_memory:1086352' -> ['used_memory', '1086352'] -> 1086352
        const usedMemory = parseInt(info.split('\r\n')[1].split(':')[1], 10)
        if (usedMemory > this.memoryThreshold) {
          closingCallback(`${this.name} Redis instance is using abnormally high memory.`)
        } else {
          closingCallback() // Success.
        }
      })
    }
  })
}

module.exports = RedisStatus
