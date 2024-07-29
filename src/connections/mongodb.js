const mongoose = require('mongoose');

const ConnectDb = (url) => {
    const connection = mongoose.createConnection(url);

    connection.on('connected', function () {
        console.log(`Mongodb was connected ${this.name}`);
    });

    connection.on('disconnected', function () {
        console.log(`Mongodb was disconnected ${this.name}`);
    });

    connection.on('error', (error) => {
        console.log(`Mongodb was error ${JSON.stringify(error)}`);
    });

    process.on('SIGINT', async function () {
        await connection.close();
        process.exit(0);
    });

    return connection;
};

module.exports = ConnectDb(process.env.URL_MONGODB);
