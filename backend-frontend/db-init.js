import r from "./r.js";
import { db } from "./config.js";

export default (async () => {
    let cursor = await r.dbList().run();
    const dbList = await cursor.toArray();
    if (!dbList.includes(db.name)) {
        await r.dbCreate(db.name);
        console.info(`Created database '${db.name}'`);
    } else {
        console.info(`Database '${db.name}' already exists`);
    }
})();
