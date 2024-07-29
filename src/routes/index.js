const swaggerUi = require('swagger-ui-express');

const AuthRoutes = require('../routes/auth.route');
const UserRoutes = require('../routes/user.router');
const GeneralRoutes = require('../routes/general.route');
const MessageRoutes = require('../routes/message.route');
const ConversationRoutes = require('../routes/conversation.route');
const FriendRoute = require('../routes/friend.route');
const PaymentRoute = require('../routes/payment.route');
const configSwagger = require('../config/swagger');

const routes = (app) => {
    app.use('/auth', AuthRoutes);
    app.use('/users', UserRoutes);
    app.use('/friends', FriendRoute);
    app.use('/messages', MessageRoutes);
    app.use('/conversations', ConversationRoutes);
    app.use('/payments', PaymentRoute);
    app.use('/documentations', swaggerUi.serve, swaggerUi.setup(configSwagger));
    app.use('/', GeneralRoutes);
};

module.exports = routes;
