require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const routes = require('@/routes');

require('@/connections/mongodb');
require('@/utils/resetRequestTranslate');

const { app, server } = require('@/connections/socketio');
const User = require('@/model/user.model');

const port = process.env.PORT || 3000;

// middleware
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());
app.use(cookieParser());

// routes
routes(app);

app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    console.log('err: ', err);
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        status: statusCode,
    });
    next();
});

process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error:', err);
    User.updateMany({}, { $set: { socketId: [], is_online: false } })
        .then((result) => {
            server.close(() => {
                process.exit(1);
            });
        })
        .catch((updateErr) => {
            console.error('Error updating users on uncaughtException:', updateErr);
            server.close(() => {
                process.exit(1);
            });
        });
});

server.close(() => {
    console.log('Server has been closed.');
    User.updateMany({}, { $set: { socketId: [], is_online: false } })
        .then((result) => {
            console.log('Server closed');
        })
        .catch((err) => {
            console.error('Error updating users on server close:', err);
        });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});
