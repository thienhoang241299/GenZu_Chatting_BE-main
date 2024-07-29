module.exports = {
    home: (req, res) => {
        res.send('Welcome to genzu BE <a href="/documentations">Documentations</a>');
    },
    notFound: (req, res) => {
        res.status(404).send('not found');
    },
};
