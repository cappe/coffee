import r from "../r.js";
import CoffeeMaker from "./coffeemaker.js";
import ActiveRecord from "./active-record.js";
import PushSubscription from "./push-subscription.js"
import EventLogEntry from "./event-log-entry.js";

/**
 * @type {typeof ActiveRecord[]}
 */
const models = [CoffeeMaker, PushSubscription, EventLogEntry];

/**
 * Shoud we move this logic into ActiveRecord::boot() or something?
 */

export default r.tableList().run()
    .then(cursor => cursor.toArray())
    .then(async tableList => {
        for (let model of models) {
            await model.boot(tableList);
        }
    })
    .then(async () => {
        for (let model of models) {
            await model.afterBoot();
        }
    });
