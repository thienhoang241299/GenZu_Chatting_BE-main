const express = require('express');
require('dotenv').config();
const cors = require('cors');
var cookieParser = require('cookie-parser');

const routes = require('./src/routes');
require('./src/connections/mongodb');
const { app, server } = require('./src/connections/socketio');

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
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        status: statusCode,
    });
    next();
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
