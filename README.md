## Installation (for development)

```bash
git clone git@github.com:valtzu/smart-coffee
cd smart-coffee
docker-compose up
```

You will notice that some env variables have to be set, but the intention is to get rid of those.
The project uses OVH DNS validation to get valid SSL cert even for development, so if you don't have OVH DNS services, you're out of luck.

Set your domain's A record to point to localhost / 127.0.0.1 and you're good to go.

Vapid keys can be generated using the `npm run vapid` but that will change in the future.


# Credits
Coffee cup icon made by [Freepik](http://www.freepik.com "Freepik") from [www.flaticon.com](https://www.flaticon.com "Flaticon") is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/ "Creative Commons BY 3.0").
