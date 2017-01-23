import Raven from "./raven"


Raven.config('https://public@getsentry.com/1').install();

Raven.config(
    'https://public@getsentry.com/1', 
    {
        logger: 'my-logger',
        ignoreUrls: [
            /graph\.facebook\.com/i
        ],
        ignoreErrors: [
            'fb_xd_fragment'
        ],
        includePaths: [
            /https?:\/\/(www\.)?getsentry\.com/,
            /https?:\/\/d3nslu0hdya83q\.cloudfront\.net/
        ]
    }
).install();

var throwsError = () => {
    throw new Error('broken');
};

try {
    throwsError();
} catch(e) {
    Raven.captureException(e);
    Raven.captureException(e, {tags: { key: "value" }});
}

Raven.context(throwsError);
Raven.context({tags: { key: "value" }}, throwsError);
Raven.context({extra: {planet: {name: 'Earth'}}}, throwsError);

setTimeout(Raven.wrap(throwsError), 1000);
Raven.wrap({logger: "my.module"}, throwsError)();
Raven.wrap({tags: {git_commit: 'c0deb10c4'}}, throwsError)();

Raven.setUserContext({
    email: 'matt@example.com',
    id: '123'
});

Raven.captureMessage('Broken!');
Raven.captureMessage('Broken!', {tags: { key: "value" }});

Raven.showReportDialog({
    eventId: 0815,
    dsn:'1337asdf',
    user: {
        name: 'DefenitelyTyped',
        email: 'df@ts.ms'
    }
});

Raven.setTagsContext({ key: "value" });

Raven.setExtraContext({ foo: "bar" });
