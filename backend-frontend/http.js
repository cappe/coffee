import nodeFetch from "node-fetch";
import http from 'http';
import https from 'https';

const agentOpts = {
  keepAlive: true,
  keepAliveMsecs: 120000,
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
