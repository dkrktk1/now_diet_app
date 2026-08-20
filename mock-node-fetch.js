const _fetch = window.fetch.bind(window);
_fetch.Headers = window.Headers;
_fetch.Request = window.Request;
_fetch.Response = window.Response;

export default _fetch;
export const Headers = window.Headers;
export const Request = window.Request;
export const Response = window.Response;
