import express from "express";
import CoffeeMaker from '../../models/coffeemaker.js';
import TpLinkCloud from '../../shared/tplink-cloud.js';

const router = express.Router();

router.post('/login', async (req, res, next) => {
    const tplink = new TpLinkCloud(req.body)

    try {
        await tplink.login();
    } catch (err) {
        res.status(403);
        res.end();
    }

    res.json({
        token: tplink.token
    });

    res.end();
});

router.get('/devices', async (req, res, next) => {
    const tplink = new TpLinkCloud(req.query);

    try {
        res.json(await tplink.getDeviceList());
    } catch (err) {
        res.status(503);
        res.end();
    }

    res.end();
});

export default router;
