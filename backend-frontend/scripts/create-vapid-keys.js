import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log("Copy the following values into .env file");
console.log(`VAPID_PRIVATE_KEY: ${keys.privateKey}`);
console.log(`VAPID_PUBLIC_KEY: ${keys.publicKey}`);
