import ActiveRecord from './active-record.js';
import TpLinkCloud from '../shared/tplink-cloud.js';
import PushSubscription from './push-subscription.js';
import Notification from './notification.js';
import EventLogEntry from './event-log-entry.js';

/** @type {Object<string, NodeJS.Timer>} */
const timers = {};

/** @type {Number} */
const POLLING_INTERVAL_DEFAULT = 5000; // 5 seconds
const POLLING_INTERVAL_OFFLINE = 300000; // 5 minute
const POLLING_INTERVAL_ERROR = 900000; // 15 minutes

/**
 * @typedef CoffeeMakerCalibration
 * @property {number} coldStartCompensationKwh
 * @property {number} coldStartThresholdSeconds
 * @property {number} powerOnThresholdWatts
 * @property {number} finishingSeconds
 * @property {number} finishingSecondsPerBatch
 * @property {number} actionThresholdWatts
 * @property {number} kwhPerBatch
 */

/**
 * @typedef CoffeeMakerState
 * @property {Date} lastPowerOff
 * @property {{power: number, total: number, progress: number}} previous
 * @property {{power: number, total: number, progress: number}} current
 * @property {{power: number, total: number, progress: number}} start
 * @property {Number} interval
 */
export default class CoffeeMaker extends ActiveRecord {

  constructor(props, opts) {
    props = props || {};
    if (!(props.cloud instanceof TpLinkCloud))
      props.cloud = new TpLinkCloud(props.cloud || {});

    if (!props.calibration) {
      // set the initial values
      props.calibration = Object.assign({
        coldStartCompensationKwh: 0.004,
        coldStartThresholdSeconds: 1200,
        kwhPerBatch: 0.1360,
        powerOnThresholdWatts: 5,
        actionThresholdWatts: 150,
        finishingSeconds: 30,
        finishingSecondsPerBatch: 90
      }, props.calibration || {});
    }

    if (!props.state) {
      props.state = {
        previous: {},
        current: {},
        start: {},
        lastPowerOff: null,
        interval: POLLING_INTERVAL_DEFAULT
      };
    }

    super(props, opts);
  }

  static get table() {
    return "configs";
  }

  static get primaryKey() {
    return "domain";
  }

  /**
   * Called after all models have been booted
   * @returns {Promise}
   */
  static async afterBoot() {
    await super.afterBoot();
    if (process.env.NODE_ENV !== "development")
      await this.startListening();
  }

  /** @type {string} */
  get domain() {
    return this.__data.domain;
  }

  /** @type {string} */
  get slackUrl() {
    return this.__data.slackUrl;
  }

  /** @type {TpLinkCloud} */
  get cloud() {
    return this.__data.cloud;
  }

  /**  @type {CoffeeMakerCalibration} */
  get calibration() {
    return this.__data.calibration;
  }

  /** @type {CoffeeMakerState} */
  get state() {
    return this.__data.state;
  }

  /**
   * Checks whether currently doing a cold start
   */
  isColdStart() {
    if (this.state.lastPowerOff === null)
      return true;

    return (new Date().getTime() - this.state.lastPowerOff.getTime()) / 1000 > this.calibration.coldStartThresholdSeconds;
  }

  /**
   * Start listening events on all coffee makers
   */
  static async startListening() {
    try {
      /** @type {CoffeeMaker[]} */
      const coffeeMakers = await this.getAll();

      for (let coffeeMaker of coffeeMakers) {
        coffeeMaker.startListening();
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Stop listening events on all coffee makers
   */
  static async stopListening() {
    /** @type {CoffeeMaker[]} */
    const coffeeMakers = await this.getAll();

    for (let coffeeMaker of coffeeMakers) {
      coffeeMaker.stopListening();
    }
  }

  /**
   * @param {string} [event]
   * @returns {Promise<PushSubscription[]>}
   */
  async getSubscriptions(event) {
    if (!event)
      return await PushSubscription.getAllByDomain(this.domain);

    return await PushSubscription.getAllByDomainAndEvent(this.domain, event);
  }

  /**
   * Log an event into event log table
   * @param {string} event
   * @param {Object} params
   */
  async log(event, params) {
    const logEntry = new EventLogEntry({
      domain: this.domain,
      event,
      params
    });
    await logEntry.save();
  }

  /**
   *
   * @param {string} event
   * @param {Object} params
   */
  emit(event, params) {
    const notification = Notification.get(event);

    if (['starting', 'finished', 'power-off'].includes(event)) {
      this.log(event, params);
      if (this.slackUrl)
        notification.sendToSlack(this.slackUrl);
    }

    this.getSubscriptions(event)
      .then(recipients => {
        return notification.sendTo(recipients);
      }).catch((e) => {
      console.error(e);
    });
  }

  /**
   * @returns {boolean}
   */
  hasJustBeenPoweredOn() {
    if (!this.state.previous)
      return false;

    return this.state.previous.power < this.calibration.powerOnThresholdWatts
      && this.state.current.power > this.calibration.powerOnThresholdWatts;
  }

  /**
   * @returns {boolean}
   */
  hasJustBeenPoweredOff() {
    if (!this.state.previous)
      return false;

    return this.state.previous.power > this.calibration.powerOnThresholdWatts
      && this.state.current.power < this.calibration.powerOnThresholdWatts;
  }

  /**
   * @returns {boolean}
   */
  hasJustStartedHeatingTheWater() {
    if (this.state.start !== null)
      return false;

    return this.isHeatingTheWater();
  }

  /**
   * @returns {boolean}
   */
  hasJustFinishedHeatingTheWater() {
    if (this.state.start === null)
      return false;

    // at least 10% of the batch must be ready, otherwise this is a false alarm
    if ((this.state.current.progress || 0) < 0.10)
      return false;

    return !this.isHeatingTheWater();
  }

  /**
   * @returns {boolean}
   */
  isHeatingTheWater() {
    return (this.state.current.power > this.calibration.actionThresholdWatts);
  }

  /**
   * @returns {boolean}
   */
  hasJustMadeProgress() {
    return this.state.previous && this.state.current.progress !== this.state.previous.progress;
  }

  /**
   * @private
   * @returns {void}
   */
  updatePowerStatus() {
    if (this.hasJustBeenPoweredOff()) {
      this.emit('power-off', this.state.current);
      this.state.lastPowerOff = new Date();
    } else if (this.hasJustBeenPoweredOn()) {
      this.emit('power-on', this.state.current);
    }
  }

  /**
   * @private
   * @returns {void}
   */
  updateWaterHeatingStatus() {
    const {calibration, state} = this;

    if (this.hasJustStartedHeatingTheWater()) {
      const startState = state.previous || state.current;
      startState.progress = 0;

      if (this.isColdStart())
        startState.total += calibration.coldStartCompensationKwh;

      this.emit('starting', startState);
      state.start = startState;
      return;
    } else if (state.start === null) {
      return;
    }

    const kwh = Math.max(state.current.total - state.start.total, 0);

    // In case the current consumption exceeds the current kwhPerBatch value,
    // let's do an automatic recalibration.
    if (kwh > calibration.kwhPerBatch)
      calibration.kwhPerBatch = kwh;

    state.current.progress = (kwh / calibration.kwhPerBatch) || 0;

    if (this.hasJustFinishedHeatingTheWater()) {
      this.emit('finishing', state.current);
      const finishedState = Object.assign({}, state.current);
      state.start = null;
      setTimeout(() => {
        this.emit('finished', finishedState);
      }, (calibration.finishingSeconds + state.current.progress * calibration.finishingSecondsPerBatch) * 1000);
    } else if (this.hasJustMadeProgress()) {
      this.emit('progress', state.current);
    }
  }

  async refreshToken() {
    console.info(`${this.domain}: Trying to refresh the access token`);
    try {
      const oldToken = this.cloud.token;
      await this.cloud.login();
      if (oldToken === this.cloud.token)
        throw new Error("Unable to renew the token");
      console.info("Access token refreshed");
    } catch (err) {
      console.error(`${this.domain}: ${err}`);
      this.stopListening();
    }
  }

  /**
   * Updates the machine status from the cloud
   * @private
   * @returns {Promise<void>}
   */
  async updateStatus() {
    try {
      const {power, total} = await this.cloud.getEmeterStatus();
      this.state.current = {
        power,
        total,
        progress: this.state.previous.progress || 0,
      };

      // if everything went well, let's make sure we are polling at the normal rate
      if (this.state.interval !== POLLING_INTERVAL_DEFAULT)
        this.setPollingInterval(POLLING_INTERVAL_DEFAULT);
    } catch (err) {
      console.error(`${this.domain}: ${err}`);
      switch (true) {
        case /token expired/i.test(err):
          await this.refreshToken();
          return;
        case /device is offline/i.test(err):
          this.setPollingInterval(POLLING_INTERVAL_OFFLINE);
          return;
        default:
          this.setPollingInterval(POLLING_INTERVAL_ERROR);
          return;
      }
    }

    this.updatePowerStatus();
    this.updateWaterHeatingStatus();

    // always save the state
    await this.save();

    this.state.previous = this.state.current;
  }

  /**
   * Checks whether the status polling timer is active for the domain
   * @returns {boolean}
   */
  isListening() {
    return !!timers[this.domain];
  }

  /**
   * Starts polling the device
   * @returns {void}
   */
  startListening() {
    if (this.isListening())
      return;

    if (!this.cloud.token) {
      console.error(`No TP-Link cloud token provided for "${this.domain}"`);
      return;
    }

    console.info(`${this.domain}: Starting polling`);
    this.updateStatus().then(() => {
      this.setPollingInterval(this.state.interval);
    });
  }

  setPollingInterval(interval) {
    const newPollingInterval = interval || POLLING_INTERVAL_DEFAULT;

    if (newPollingInterval !== this.state.interval || !this.isListening()) {
      this.state.interval = newPollingInterval;
      console.info(`${this.domain}: Polling with the interval of ${newPollingInterval} ms`);
    }

    if (this.isListening())
      clearInterval(timers[this.domain]);

    timers[this.domain] = setInterval(async () => await this.updateStatus(), newPollingInterval);
  }

  /**
   * Stops polling the device
   * @returns {void}
   */
  stopListening() {
    if (!this.isListening())
      return;

    clearInterval(timers[this.domain]);
    timers[this.domain] = null;
    console.log(`${this.domain}: Stopped polling`);
  }

}
