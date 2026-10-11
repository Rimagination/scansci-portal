import { AsyncLocalStorage } from 'node:async_hooks';

const requestEnvironment = new AsyncLocalStorage();
// Bindings follow the request across awaits; concurrent users never share a mutable environment.
export const env = new Proxy({}, { get: (_, name) => requestEnvironment.getStore()?.[name] });
export function withWechatEnvironment(bindings, callback) {
  return requestEnvironment.run(bindings, callback);
}
