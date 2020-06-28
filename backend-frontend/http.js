import nodeFetch from "node-fetch";
import http from 'http';
import https from 'https';
import { resolve4 } from 'dns';

const agentOpts = {
  keepAlive: true,
  timeout: 120000,
  lookup: (...args) => {
    const callback = args.pop();
    resolve4(...args, (err, [ ip ]) => callback(err, ip, 4));
  },
};

const agents = {
  'http:': new http.Agent(agentOpts),
  'https:': new https.Agent(agentOpts),
};

const fetchOptions = {
  agent: uri => agents[uri.protocol],
  timeout: 5000,
};

export const fetch = (url, opts) => nodeFetch(url, Object.assign(opts, fetchOptions));
export const Headers = nodeFetch.Headers;
export const Request = nodeFetch.Request;
export const Response = nodeFetch.Response;
