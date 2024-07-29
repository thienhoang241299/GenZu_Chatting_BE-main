const createHttpError = require('http-errors');

module.exports = {
    validateParams: (validator) => {
        return async (req, res, next) => {
            try {
                const validated = await validator.validateAsync(req.params);
                req.params = validated;
                next();
            } catch (err) {
                if (err.isJoi) return next(createHttpError(422, { message: err.message }));
                next(createHttpError(500));
            }
        };
    },
    validateQuery: (validator) => {
        return async (req, res, next) => {
            try {
                const validated = await validator.validateAsync(req.query);
                req.query = validated;
                next();
            } catch (err) {
                if (err.isJoi) return next(createHttpError(422, { message: err.message }));
                next(createHttpError(500));
            }
        };
    },
    validateBody: (validator) => {
        return async (req, res, next) => {
            try {
                const validated = await validator.validateAsync(req.body);
                req.body = validated;
                next();
            } catch (err) {
                if (err.isJoi) return next(createHttpError(422, { message: err.message }));
                next(createHttpError(500));
            }
        };
    },
};
