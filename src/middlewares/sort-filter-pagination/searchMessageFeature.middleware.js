const Message = require('@/model/message.model');

module.exports = async function (req, res, next) {
    try {
        const queryObject = { ...req.query };
        const userId = req.user._id;
        const conversation_id = req.query.id;
        const excludedFiled = ['sort', 'limit', 'page', 'field'];
        excludedFiled.forEach((ele) => delete queryObject[ele]);
        let queryString = JSON.stringify(queryObject);
        const reg = /\bgte|gt|lte|lt\b/g;
        queryString = queryString.replace(reg, (matchString) => `$${matchString}`);
        // Search
        let searchQuery;
        if (req.query.search) {
            const searchText = req.query.search.toLowerCase();
            searchQuery = {
                $or: [{ message: { $regex: searchText, $options: 'i' } }],
            };
        }
        // Date Range
        const dateQuery = {};
        if (req.query.startDate) {
            dateQuery.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
            dateQuery.$lte = new Date(req.query.endDate);
        }
        if (req.query.startDate || req.query.endDate) {
            searchQuery = { createdAt: dateQuery };
        }
        if (req.query.sender) {
            searchQuery = { sender: req.query.sender, ...searchQuery };
        }
        const pageLimit = 40;

        let query = await Message.find({
            conversation: conversation_id,
            status: 'active',
            deleteBy: { $nin: userId },
        })
            .find(req.query.search ? searchQuery : {})
            .populate('sender', '_id fullName picture')
            .populate('affected_user_id', '_id fullName picture')
            .populate('conversation')
            .populate({
                path: 'emojiBy',
                populate: {
                    path: 'sender',
                    select: 'fullName _id',
                },
            });

        const results = {
            totalDocs: 0,
            data: [],
        };
        const data = [];
        for (const message of query) {
            // Tìm vị trí của tin nhắn trong toàn bộ collection
            const index = await Message.countDocuments({
                $and: [
                    {
                        conversation: conversation_id,
                        status: { $in: ['active', 'recalled'] },
                        deleteBy: { $nin: userId },
                    },
                    { _id: { $gt: message._id } },
                ],
            });
            const pageNumber = Math.floor(index / pageLimit) + 1;

            data.push({
                _id: message._id,
                sender: message.sender,
                message: message.message,
                pageNumber: pageNumber,
                createdAt: message.createdAt,
            });
        }

        const totalCount = await Message.countDocuments({
            conversation: conversation_id,
            status: { $in: ['active', 'recalled'] },
            deleteBy: { $nin: userId },
        }).exec();

        results.totalDocs = totalCount;
        results.data = data;
        // console.log('querry: ', results);

        // Add paginated Results to the request
        res.paginatedResults = results;
        next();
    } catch (error) {
        next(error);
    }
};
