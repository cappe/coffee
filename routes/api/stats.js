import express from "express";
import CoffeeMaker from '../../models/coffeemaker';
import EventLogEntry from "../../models/event-log-entry";

const router = express.Router();

router.get('/', async (req, res, next) => {
    /** @type {CoffeeMaker} */
    const coffeeMaker = res.locals.coffeeMaker;
    try {
        const events = await EventLogEntry.search(coffeeMaker.domain, "finished", new Date(req.query.from || 0), new Date(req.query.to || new Date));

        res.json({
            events
        });
    } catch (ex) {
        const error = Object.assign(new Error(ex.message), { status: 400 });
        
        return next(error);
    }

    res.end();
});

export default router;
