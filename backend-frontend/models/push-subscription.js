import ActiveRecord from './active-record.js';


/**
 * A class to represent the client PushSubscription object
 */
export default class PushSubscription extends ActiveRecord {

  /**
   *
   * @param {object} props
   * @param {object} [opts]
   */
  constructor(props, opts) {
    super(props, opts);
  }

  static get table() {
    return "subscriptions";
  }

  static get primaryKey() {
    return "id";
  }

  static async boot(tableList) {
    // calling super.boot creates the table if not existing already
    await super.boot(tableList);

    const indexList = await (await this.query().indexList()).toArray();

    if (!indexList.includes("domain")) {
      await this.query().indexCreate("domain");
      await this.query().indexWait("domain");
    }

    // create a compound index containing domain & event
    if (!indexList.includes("domain-event")) {
      await this.query().indexCreate("domain-event", (subscription) => {
        return subscription("events").map((event) => [subscription("domain"), event]);
      }, {multi: true});
      await this.query().indexWait("domain-event");
    }
  }

  /**
   * Identifier generated from the end of the endpoint URI
   */
  get id() {
    return this.__data.id || (this.endpoint && this.endpoint.substr(-32));
  }

  /**
   * The domain this subscription is associated with
   * @type {string}
   */
  get domain() {
    return this.__data.domain;
  }

  /**
   * The actual Web Push endpoint URI
   * @type {string}
   */
  get endpoint() {
    return this.__data.endpoint;
  }

  /**
   * Subscription expiration time (?)
   * @type {string|Date}
   */
  get expirationTime() {
    return this.__data.expirationTime;
  }

  /**
   * Encryption keys
   * @type {{auth: string, p256dh: string}}
   */
  get keys() {
    return this.__data.keys;
  }

  /**
   * The subscribed event names
   * @type {string[]}
   */
  get events() {
    // ensure that an array will always be returned
    if (!Array.isArray(this.__data.events))
      this.__data.events = [];

    return this.__data.events;
  }

  /**
   * Subscribe to a notification event & save
   * @param {string} event
   */
  async subscribe(event) {
    if (this.events.indexOf(event) === -1)
      this.events.push(event);

    // Save to the db
    await this.save();
  }

  /**
   * Unsubscribe form a notification event & save
   * @param {string} event
   */
  async unsubscribe(event) {
    const index = this.events.indexOf(event);
    if (index !== -1)
      this.events.splice(index, 1);

    // Save to the db
    await this.save();
  }

  static async getAllByDomain(domain) {
    const result = await this.query().getAll(domain, {index: "domain"});
    const all = [];

    await result.eachAsync(sub => {
      all.push(new this(sub, {isNew: false}));
    });

    return all;
  }

  static async getAllByDomainAndEvent(domain, event) {
    const result = await this.query().getAll([domain, event], {index: "domain-event"});
    const all = [];

    await result.eachAsync(sub => {
      all.push(new this(sub, {isNew: false}));
    });

    return all;
  }
}
