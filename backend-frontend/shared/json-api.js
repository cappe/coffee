import { fetch, Response, Headers } from "../http.js";

let queue = Promise.resolve();

export default class JsonApi {
  /**
   *
   * @param {string} method
   * @param {string} url
   * @param {object} [body]
   * @param {object} [options]
   * @returns {Promise<Response>}
   */
  static request(method, url, body, options) {

    const opts = {
      method: method,
      headers: {},
    };

    if (typeof body === 'object' && body !== null) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }

    if (typeof options === 'object' && options !== null)
      Object.assign(opts, options);

    // Cast to Headers object (not sure if necessary)
    if (!(opts.headers instanceof Headers))
      opts.headers = new Headers(opts.headers);

    return queue = queue.then(() => fetch(url, opts));
  }

  /**
   *
   * @param {string} url
   * @param {object} [options]
   * @returns {Promise<Response>}
   */
  static get(url, options) {
    return this.request('GET', url, undefined, options);
  }

  /**
   *
   * @param {string} url
   * @param {object} [data]
   * @param {object} [options]
   * @returns {Promise<Response>}
   */
  static post(url, data, options) {
    return this.request('POST', url, data, options);
  }

  /**
   *
   * @param {string} url
   * @param {object} [data]
   * @param {object} [options]
   * @returns {Promise<Response>}
   */
  static put(url, data, options) {
    return this.request('PUT', url, data, options);
  }

  /**
   *
   * @param {string} url
   * @param {object} [data]
   * @param {object} [options]
   * @returns {Promise<Response>}
   */
  static delete(url, data, options) {
    return this.request('DELETE', url, data, options);
  }
}
