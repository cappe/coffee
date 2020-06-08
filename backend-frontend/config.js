import url from 'url';

if (!process.env.DATABASE_URL)
    throw new Error('DATABASE_URL environment variable is undefined');

const dbUrl = url.parse(process.env.DATABASE_URL);

export const db = {
    type: dbUrl.protocol.replace(/:$/, ''),
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '28015'),
    name: dbUrl.pathname.replace(/^\//, '') || 'test',
};

export const vapid = {
    subject: process.env.VAPID_SUBJECT,
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
};
