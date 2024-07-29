module.exports = {
    oauth2Credentials: {
        client_id: process.env.CLIENT_GOOGLE_ID,
        project_id: process.env.GOOGLE_PROJECT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_secret: process.env.CLIENT_GOOGLE_SECRET,
        redirect_uris: [`${process.env.URL_API}/auth/callback`],
        scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    },
};
