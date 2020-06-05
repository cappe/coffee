import CoffeeMaker from '../models/coffeemaker.js';
import express from "express";
import apiRoutes from './api/index.js';

const router = express.Router();

/**
 * Middleware to initialize a domain-specific CoffeeMaker instance to the request
 */
router.use(async (req, res, next) => {
    // Set CoffeeMaker instance to the request
    res.locals.coffeeMaker = await CoffeeMaker.findOrNew({domain: req.hostname});

    return next();
});

router.use(express.static('./public'));
router.use('/shared', express.static('./shared'));
router.use('/api/', apiRoutes);

/* The main index page. */
router.get('/', async (req, res) => {
    /** @type {CoffeeMaker} */
    const coffeeMaker = res.locals.coffeeMaker;

    if (coffeeMaker.isNew()) {
        // 303 See Other
        res.redirect(303, '/config');
        return;
    }

    res.render('index', {
        title: `Kahvi-ilmoitin – ${coffeeMaker.domain}`,
        coffeeMaker,
    });
});

/* The config page. */
router.get('/config', async (req, res) => {
    /** @type {CoffeeMaker} */
    const coffeeMaker = res.locals.coffeeMaker;

    res.render('config', {
        title: `Asetukset – Kahvi-ilmoitin – ${coffeeMaker.domain}`,
        coffeeMaker: coffeeMaker
    });
});

/* The statistics page. */
router.get('/stats', async (req, res) => {
    /** @type {CoffeeMaker} */
    const coffeeMaker = res.locals.coffeeMaker;

    res.render('stats', {
        title: `Tilastot – Kahvi-ilmoitin – ${coffeeMaker.domain}`,
        coffeeMaker,
        from: (new Date((new Date).getTime() - 86400000 * 30)).toISOString().substr(0, 10),
    });
});

export default router;
