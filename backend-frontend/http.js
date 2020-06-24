import nodeFetch from "node-fetch";
import http from 'http';
import https from 'https';

const agents = {
  'http:': new http.Agent({ keepAlive: true }),
  'https:': new https.Agent({ keepAlive: true }),
};

const fetchOptions = {
  agent: uri => agents[uri.protocol],
  timeout: 5000,
};

export const fetch = (url, opts) => nodeFetch(url, Object.assign(opts, fetchOptions));
export const Headers = nodeFetch.Headers;
export const Request = nodeFetch.Request;
export const Response = nodeFetch.Response;
