const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_ENDPOINT_URI, // Sử dụng URL kết nối với thông tin của bạn
});

client.on('connect', () => {
    console.log('Connected to Redis!');
});

client.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

client
    .connect()
    .then(() => {
        return client.ping();
    })
    .then((result) => {
        console.log('Ping response from Redis:', result);
    })
    .catch((err) => {
        console.error('Error pinging Redis:', err);
    });

module.exports = client;
