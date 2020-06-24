import ActiveRecord from "./active-record.js";
import r from "../r.js";

export default class EventLogEntry extends ActiveRecord {

  constructor(props, opts) {
    props = props || {};
    opts = opts || {};

    if (!props.at)
      props.at = new Date;

    super(props, opts);
  }

  static get table() {
    return "eventlog";
  }

  static get primaryKey() {
    return "id";
  }

  static async boot(tableList) {
    // calling super.boot creates the table if not existing already
    await super.boot(tableList);

    const indexList = await (await this.query().indexList().run()).toArray();

    if (!indexList.includes("at")) {
      await this.query().indexCreate("at").run();
      await this.query().indexWait("at").run();
    }

    if (!indexList.includes("domain")) {
      await this.query().indexCreate("domain").run();
      await this.query().indexWait("domain").run();
    }

    if (!indexList.includes("event")) {
      await this.query().indexCreate("event").run();
      await this.query().indexWait("event").run();
    }
  }

  get id() {
    return this.__data.id;
  }

  /**
   * @type {string}
   */
  get domain() {
    return this.__data.domain;
  }

  /**
   * @type {Date}
   */
  get at() {
    return this.__data.at;
  }

  /**
   * @type {string}
   */
  get event() {
    return this.__data.event;
  }

  /**
   * Additional parameters for the event
   * @type {Object}
   */
  get params() {
    return this.__data.params || {};
  }

  static async search(domain, event, from, to, fields = {"at": true, "params": {"progress": true}}) {
    const result = await this.query()
      .filter({domain, event})
      .filter(r.row("params")("progress").gt(.5))
      .filter(r.row("at").during(from, to))
      .orderBy(r.asc("at"))
      .pluck(fields)
      .run();
    const all = [];

    await result.eachAsync(entry => {
      all.push(new this(entry, {isNew: false}));
    });

    return all;
  }

};
