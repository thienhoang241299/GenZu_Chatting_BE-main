const userModel = require('@/model/user.model');
const { CronJob } = require('cron');

const job = new CronJob(
    '0 0 0 * * *', // cronTime
    async function () {
        await userModel.updateMany(
            {},
            {
                $set: {
                    numberCharaterTranslate: 3000,
                },
            },
        );
        console.log('Update charater translation count successfully');
    }, // onTick
    null, // onComplete
    true, // start
    'Asia/Ho_Chi_Minh', // timeZone
);

module.exports = job;
