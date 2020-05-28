(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("webextension-polyfill", ["module"], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.browser = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.6.0 - Mon Dec 23 2019 12:32:53 */

  /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */

  /* vim: set sts=2 sw=2 et tw=80: */

  /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  "use strict";

  if (typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
    const SEND_RESPONSE_DEPRECATION_WARNING = "Returning a Promise is the preferred way to send a reply from an onMessage/onMessageExternal listener, as the sendResponse will be removed from the specs (See https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)"; // Wrapping the bulk of this polyfill in a one-time-use function is a minor
    // optimization for Firefox. Since Spidermonkey does not fully parse the
    // contents of a function until the first time it's called, and since it will
    // never actually need to be called, this allows the polyfill to be included
    // in Firefox nearly for free.

    const wrapAPIs = extensionAPIs => {
      // NOTE: apiMetadata is associated to the content of the api-metadata.json file
      // at build time by replacing the following "include" with the content of the
      // JSON file.
      const apiMetadata = {
        "alarms": {
          "clear": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "clearAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "get": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "bookmarks": {
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getChildren": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getRecent": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getSubTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTree": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeTree": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "browserAction": {
          "disable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "enable": {
            "minArgs": 0,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "getBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getBadgeText": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "openPopup": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setBadgeBackgroundColor": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setBadgeText": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "browsingData": {
          "remove": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "removeCache": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCookies": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeDownloads": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFormData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeHistory": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeLocalStorage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePasswords": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removePluginData": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "settings": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "commands": {
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "contextMenus": {
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "cookies": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAllCookieStores": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "set": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "devtools": {
          "inspectedWindow": {
            "eval": {
              "minArgs": 1,
              "maxArgs": 2,
              "singleCallbackArg": false
            }
          },
          "panels": {
            "create": {
              "minArgs": 3,
              "maxArgs": 3,
              "singleCallbackArg": true
            }
          }
        },
        "downloads": {
          "cancel": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "download": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "erase": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFileIcon": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "open": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "pause": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeFile": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "resume": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "extension": {
          "isAllowedFileSchemeAccess": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "isAllowedIncognitoAccess": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "history": {
          "addUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "deleteRange": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "deleteUrl": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getVisits": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "search": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "i18n": {
          "detectLanguage": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAcceptLanguages": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "identity": {
          "launchWebAuthFlow": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "idle": {
          "queryState": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "management": {
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getSelf": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "setEnabled": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "uninstallSelf": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "notifications": {
          "clear": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPermissionLevel": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        },
        "pageAction": {
          "getPopup": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getTitle": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "hide": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setIcon": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "setPopup": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "setTitle": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          },
          "show": {
            "minArgs": 1,
            "maxArgs": 1,
            "fallbackToNoCallback": true
          }
        },
        "permissions": {
          "contains": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "request": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "runtime": {
          "getBackgroundPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getPlatformInfo": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "openOptionsPage": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "requestUpdateCheck": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "sendMessage": {
            "minArgs": 1,
            "maxArgs": 3
          },
          "sendNativeMessage": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "setUninstallURL": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "sessions": {
          "getDevices": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getRecentlyClosed": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "restore": {
            "minArgs": 0,
            "maxArgs": 1
          }
        },
        "storage": {
          "local": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          },
          "managed": {
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            }
          },
          "sync": {
            "clear": {
              "minArgs": 0,
              "maxArgs": 0
            },
            "get": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "getBytesInUse": {
              "minArgs": 0,
              "maxArgs": 1
            },
            "remove": {
              "minArgs": 1,
              "maxArgs": 1
            },
            "set": {
              "minArgs": 1,
              "maxArgs": 1
            }
          }
        },
        "tabs": {
          "captureVisibleTab": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "create": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "detectLanguage": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "discard": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "duplicate": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "executeScript": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 0
          },
          "getZoom": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getZoomSettings": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "highlight": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "insertCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "move": {
            "minArgs": 2,
            "maxArgs": 2
          },
          "query": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "reload": {
            "minArgs": 0,
            "maxArgs": 2
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "removeCSS": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "sendMessage": {
            "minArgs": 2,
            "maxArgs": 3
          },
          "setZoom": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "setZoomSettings": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "update": {
            "minArgs": 1,
            "maxArgs": 2
          }
        },
        "topSites": {
          "get": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "webNavigation": {
          "getAllFrames": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "getFrame": {
            "minArgs": 1,
            "maxArgs": 1
          }
        },
        "webRequest": {
          "handlerBehaviorChanged": {
            "minArgs": 0,
            "maxArgs": 0
          }
        },
        "windows": {
          "create": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "get": {
            "minArgs": 1,
            "maxArgs": 2
          },
          "getAll": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getCurrent": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "getLastFocused": {
            "minArgs": 0,
            "maxArgs": 1
          },
          "remove": {
            "minArgs": 1,
            "maxArgs": 1
          },
          "update": {
            "minArgs": 2,
            "maxArgs": 2
          }
        }
      };

      if (Object.keys(apiMetadata).length === 0) {
        throw new Error("api-metadata.json has not been included in browser-polyfill");
      }
      /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */


      class DefaultWeakMap extends WeakMap {
        constructor(createItem, items = undefined) {
          super(items);
          this.createItem = createItem;
        }

        get(key) {
          if (!this.has(key)) {
            this.set(key, this.createItem(key));
          }

          return super.get(key);
        }

      }
      /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */


      const isThenable = value => {
        return value && typeof value === "object" && typeof value.then === "function";
      };
      /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.rejection
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {integer} metadata.maxResolvedArgs
       *        The maximum number of arguments which may be passed to the
       *        callback created by the wrapped async function.
       *
       * @returns {function}
       *        The generated callback function.
       */


      const makeCallback = (promise, metadata) => {
        return (...callbackArgs) => {
          if (extensionAPIs.runtime.lastError) {
            promise.reject(extensionAPIs.runtime.lastError);
          } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
            promise.resolve(callbackArgs[0]);
          } else {
            promise.resolve(callbackArgs);
          }
        };
      };

      const pluralizeArguments = numArgs => numArgs == 1 ? "argument" : "arguments";
      /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxResolvedArgs
       *        The maximum number of arguments which may be passed to the
       *        callback created by the wrapped async function.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */


      const wrapAsyncFunction = (name, metadata) => {
        return function asyncFunctionWrapper(target, ...args) {
          if (args.length < metadata.minArgs) {
            throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
          }

          if (args.length > metadata.maxArgs) {
            throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
          }

          return new Promise((resolve, reject) => {
            if (metadata.fallbackToNoCallback) {
              // This API method has currently no callback on Chrome, but it return a promise on Firefox,
              // and so the polyfill will try to call it with a callback first, and it will fallback
              // to not passing the callback if the first call fails.
              try {
                target[name](...args, makeCallback({
                  resolve,
                  reject
                }, metadata));
              } catch (cbError) {
                console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                target[name](...args); // Update the API method metadata, so that the next API calls will not try to
                // use the unsupported callback anymore.

                metadata.fallbackToNoCallback = false;
                metadata.noCallback = true;
                resolve();
              }
            } else if (metadata.noCallback) {
              target[name](...args);
              resolve();
            } else {
              target[name](...args, makeCallback({
                resolve,
                reject
              }, metadata));
            }
          });
        };
      };
      /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */


      const wrapMethod = (target, method, wrapper) => {
        return new Proxy(method, {
          apply(targetMethod, thisObj, args) {
            return wrapper.call(thisObj, target, ...args);
          }

        });
      };

      let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
      /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */

      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },

          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }

            if (!(prop in target)) {
              return undefined;
            }

            let value = target[prop];

            if (typeof value === "function") {
              // This is a method on the underlying object. Check if we need to do
              // any wrapping.
              if (typeof wrappers[prop] === "function") {
                // We have a special-case wrapper for this method.
                value = wrapMethod(target, target[prop], wrappers[prop]);
              } else if (hasOwnProperty(metadata, prop)) {
                // This is an async method that we have metadata for. Create a
                // Promise wrapper for it.
                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                value = wrapMethod(target, target[prop], wrapper);
              } else {
                // This is a method that we don't know or care about. Return the
                // original method, bound to the underlying object.
                value = value.bind(target);
              }
            } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
              // This is an object that we need to do some wrapping for the children
              // of. Create a sub-object wrapper for it with the appropriate child
              // metadata.
              value = wrapObject(value, wrappers[prop], metadata[prop]);
            } else if (hasOwnProperty(metadata, "*")) {
              // Wrap all properties in * namespace.
              value = wrapObject(value, wrappers[prop], metadata["*"]);
            } else {
              // We don't need to do any wrapping for this property,
              // so just forward all access to the underlying object.
              Object.defineProperty(cache, prop, {
                configurable: true,
                enumerable: true,

                get() {
                  return target[prop];
                },

                set(value) {
                  target[prop] = value;
                }

              });
              return value;
            }

            cache[prop] = value;
            return value;
          },

          set(proxyTarget, prop, value, receiver) {
            if (prop in cache) {
              cache[prop] = value;
            } else {
              target[prop] = value;
            }

            return true;
          },

          defineProperty(proxyTarget, prop, desc) {
            return Reflect.defineProperty(cache, prop, desc);
          },

          deleteProperty(proxyTarget, prop) {
            return Reflect.deleteProperty(cache, prop);
          }

        }; // Per contract of the Proxy API, the "get" proxy handler must return the
        // original value of the target if that value is declared read-only and
        // non-configurable. For this reason, we create an object with the
        // prototype set to `target` instead of using `target` directly.
        // Otherwise we cannot return a custom object for APIs that
        // are declared read-only and non-configurable, such as `chrome.devtools`.
        //
        // The proxy handlers themselves will still use the original `target`
        // instead of the `proxyTarget`, so that the methods and properties are
        // dereferenced via the original targets.

        let proxyTarget = Object.create(target);
        return new Proxy(proxyTarget, handlers);
      };
      /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */


      const wrapEvent = wrapperMap => ({
        addListener(target, listener, ...args) {
          target.addListener(wrapperMap.get(listener), ...args);
        },

        hasListener(target, listener) {
          return target.hasListener(wrapperMap.get(listener));
        },

        removeListener(target, listener) {
          target.removeListener(wrapperMap.get(listener));
        }

      }); // Keep track if the deprecation warning has been logged at least once.


      let loggedSendResponseDeprecationWarning = false;
      const onMessageWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }
        /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */


        return function onMessage(message, sender, sendResponse) {
          let didCallSendResponse = false;
          let wrappedSendResponse;
          let sendResponsePromise = new Promise(resolve => {
            wrappedSendResponse = function (response) {
              if (!loggedSendResponseDeprecationWarning) {
                console.warn(SEND_RESPONSE_DEPRECATION_WARNING, new Error().stack);
                loggedSendResponseDeprecationWarning = true;
              }

              didCallSendResponse = true;
              resolve(response);
            };
          });
          let result;

          try {
            result = listener(message, sender, wrappedSendResponse);
          } catch (err) {
            result = Promise.reject(err);
          }

          const isResultThenable = result !== true && isThenable(result); // If the listener didn't returned true or a Promise, or called
          // wrappedSendResponse synchronously, we can exit earlier
          // because there will be no response sent from this listener.

          if (result !== true && !isResultThenable && !didCallSendResponse) {
            return false;
          } // A small helper to send the message if the promise resolves
          // and an error if the promise rejects (a wrapped sendMessage has
          // to translate the message into a resolved promise or a rejected
          // promise).


          const sendPromisedResult = promise => {
            promise.then(msg => {
              // send the message value.
              sendResponse(msg);
            }, error => {
              // Send a JSON representation of the error if the rejected value
              // is an instance of error, or the object itself otherwise.
              let message;

              if (error && (error instanceof Error || typeof error.message === "string")) {
                message = error.message;
              } else {
                message = "An unexpected error occurred";
              }

              sendResponse({
                __mozWebExtensionPolyfillReject__: true,
                message
              });
            }).catch(err => {
              // Print an error on the console if unable to send the response.
              console.error("Failed to send onMessage rejected reply", err);
            });
          }; // If the listener returned a Promise, send the resolved value as a
          // result, otherwise wait the promise related to the wrappedSendResponse
          // callback to resolve and send it as a response.


          if (isResultThenable) {
            sendPromisedResult(result);
          } else {
            sendPromisedResult(sendResponsePromise);
          } // Let Chrome know that the listener is replying.


          return true;
        };
      });

      const wrappedSendMessageCallback = ({
        reject,
        resolve
      }, reply) => {
        if (extensionAPIs.runtime.lastError) {
          // Detect when none of the listeners replied to the sendMessage call and resolve
          // the promise to undefined as in Firefox.
          // See https://github.com/mozilla/webextension-polyfill/issues/130
          if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
            resolve();
          } else {
            reject(extensionAPIs.runtime.lastError);
          }
        } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
          // Convert back the JSON representation of the error into
          // an Error instance.
          reject(new Error(reply.message));
        } else {
          resolve(reply);
        }
      };

      const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
        if (args.length < metadata.minArgs) {
          throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
        }

        if (args.length > metadata.maxArgs) {
          throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
        }

        return new Promise((resolve, reject) => {
          const wrappedCb = wrappedSendMessageCallback.bind(null, {
            resolve,
            reject
          });
          args.push(wrappedCb);
          apiNamespaceObj.sendMessage(...args);
        });
      };

      const staticWrappers = {
        runtime: {
          onMessage: wrapEvent(onMessageWrappers),
          onMessageExternal: wrapEvent(onMessageWrappers),
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 1,
            maxArgs: 3
          })
        },
        tabs: {
          sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
            minArgs: 2,
            maxArgs: 3
          })
        }
      };
      const settingMetadata = {
        clear: {
          minArgs: 1,
          maxArgs: 1
        },
        get: {
          minArgs: 1,
          maxArgs: 1
        },
        set: {
          minArgs: 1,
          maxArgs: 1
        }
      };
      apiMetadata.privacy = {
        network: {
          "*": settingMetadata
        },
        services: {
          "*": settingMetadata
        },
        websites: {
          "*": settingMetadata
        }
      };
      return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
    };

    if (typeof chrome != "object" || !chrome || !chrome.runtime || !chrome.runtime.id) {
      throw new Error("This script should only be loaded in a browser extension.");
    } // The build process adds a UMD wrapper around this file, which makes the
    // `module` variable available.


    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = browser;
  }
});
//# sourceMappingURL=browser-polyfill.js.map

function TranslationFactory() {
  const translations = {
    ca: {
      showOnlyVideo: 'Mostra només els participants amb video',
      highlightSpeaker: 'Ressalta els que parlen',
      includeOwnVideo: 'Inclou el meu video a la graella',
      autoEnable: 'Habilita la vista en graella de manera predeterminada',
      notRunning: "La vista en graella no s'està executant en aquesta pàgina",
      noMeeting: "La vista en graella no s'executarà fins que no et connectis a una trucada",
      enabled: 'Activar vista en graella',
      sourceCode: 'Codi font disponible a Github',
      screenCaptureMode: 'Activar mode de captura',
      screenCaptureModeDescription: 'Força 16:9, desactiva els noms, bloqueja vídeos al seu lloc',
      unauthorizedWarning: `Instal·leu l'extensió oficial fent clic aquí.`,
    },
    da: {
      showOnlyVideo: 'Vis kun deltagere med video',
      highlightSpeaker: 'Fokus på talene personer',
      includeOwnVideo: 'Vis mig selv i Grid',
      autoEnable: 'Tænd for Grid automatisk',
      notRunning: 'Grid View kører ikke på denne side',
      noMeeting: 'Grid View kører ikke indtil du deltager i et møde',
      enabled: 'Aktiver Grid View',
      sourceCode: 'Kildekoden er tilgøngelig på Github',
      screenCaptureMode: 'Aktiver skærmoptager',
      screenCaptureModeDescription: 'Gennemtvinger 16:9, Deaktiverer navne, Låser video-positioner',
      unauthorizedWarning: `Installer venligst den officielle, ved at klikke her.`,
    },
    de: {
      showOnlyVideo: 'Nur Teilnehmer mit Video anzeigen',
      highlightSpeaker: 'Sprecher hervorheben',
      includeOwnVideo: 'Mich im Raster anzeigen',
      autoEnable: 'Rasteransicht automatisch aktivieren',
      notRunning: 'Rasteransicht ist für diese Seite nicht aktiv',
      noMeeting: 'Rasteransicht ist solange nicht aktiv, bis Sie dem Meeting beitreten',
      enabled: 'Rasteransicht anschalten',
      sourceCode: 'Der Quellcode ist auf Github zugänglich',
      screenCaptureMode: 'Aktiviere Bildschirmaufnahme Modus',
      screenCaptureModeDescription: 'Erwingt 16:9, entfernt Namen, fixiert Video Position',
      unauthorizedWarning: `Bitte installieren Sie die offizielle Version, klicken Sie dafür hier.`,
    },
    en: {
      showOnlyVideo: 'Only show participants with video',
      highlightSpeaker: 'Highlight speakers',
      includeOwnVideo: 'Include yourself in the grid',
      autoEnable: 'Enable grid view by default',
      notRunning: 'Grid View is not running on this page',
      noMeeting: 'Grid View does not run until you join the meeting',
      enabled: 'Enable Grid View',
      sourceCode: 'Source Code available on Github',
      screenCaptureMode: 'Enable Screen Capture Mode',
      screenCaptureModeDescription: 'Forces 16:9, Disables names, Locks videos in place',
      unauthorizedWarning: `Please install Chris Gamble's official release by clicking here.`,
      hideParticipant: 'Hide Participant',
      showParticipant: 'Show Participant',
    },
    es: {
      showOnlyVideo: 'Mostrar solo participantes con vídeo',
      highlightSpeaker: 'Resaltar los que hablan',
      includeOwnVideo: 'Incluir mi vídeo en la cuadrícula',
      autoEnable: 'Habilitar vista en cuadrícula por defecto',
      notRunning: 'La vista en cuadrícula no funciona en esta página',
      noMeeting: 'La vista en cuadrícula no funciona hasta que no estés en una llamada',
      enabled: 'Habilitar vista en cuadrícula',
      sourceCode: 'Código fuente disponible en Github',
      screenCaptureMode: 'Habilitar modo captura de pantalla',
      screenCaptureModeDescription: 'Forzar 16:9, deshabilita nombres, fija el vídeo en su lugar',
      unauthorizedWarning: `Por favor, instale la versión oficial haciendo clic aquí.`,
    },
    fr: {
      showOnlyVideo: 'Ne montrer que les participants avec caméra',
      highlightSpeaker: 'Surligner ceux qui parlent',
      includeOwnVideo: 'Vous inclure dans la grille',
      autoEnable: 'Activer la vue grille par défaut',
      notRunning: 'La vue grille ne fonctionne pas sur cette page',
      noMeeting: 'La vue grille ne fonctionne pas tant que vous ne rejoignez pas de réunion',
      enabled: 'Activer la vue grille',
      sourceCode: 'Code source disponible sur Github',
      screenCaptureMode: "Activer le mode capture d'écran",
      screenCaptureModeDescription: "Force l'affichage 16:9, désactive les noms, vérrouille les positions des vidéos",
      unauthorizedWarning: `Installez la version officielle en cliquant ici.`,
    },
    hr: {
      showOnlyVideo: 'Prikaži samo sudionike sa kamerom',
      highlightSpeaker: 'Naglasi govornike',
      includeOwnVideo: 'Uključi sebe u mrežnom prikazu',
    },
    it: {
      showOnlyVideo: 'Mostra solo i partecipanti con la fotocamera attiva',
      highlightSpeaker: 'Illumina chi sta parlando',
      includeOwnVideo: 'Includi te stesso nella griglia',
      autoEnable: 'Attiva sempre la griglia',
      notRunning: 'Grid View non funziona in questa pagina',
      noMeeting: 'Grid View non funziona se non sei connesso',
      enabled: 'Attiva Grid View',
      sourceCode: 'Il codice sorgente è disponibile su Github',
      screenCaptureMode: 'Attiva la modalià registrazione della schermata',
      screenCaptureModeDescription: 'Forza 16:9, Disattiva i nomi, Blocca i video nella posizione',
      unauthorizedWarning: `Installa la versione ufficiale cliccando qua.`,
    },
    ja: {
      showOnlyVideo: 'カメラをオンにしている参加者のみ',
      highlightSpeaker: '発言者をハイライト',
      includeOwnVideo: '自分を含める',
      autoEnable: '初期状態でグリッド表示を有効化',
      screenCaptureMode: '画面キャプチャモードを有効化',
      screenCaptureModeDescription: '画面比率を16:9, 名前を非表示, ビデオの位置を固定にします。',
    },
    nl: {
      showOnlyVideo: 'Toon alleen deelnemers met video',
      highlightSpeaker: 'Highlight sprekers',
      includeOwnVideo: 'Toon jezelf in het raster',
      autoEnable: 'Raster automatisch inschakelen',
      notRunning: 'Het raster staat niet aan op deze pagina',
      noMeeting: 'Het raster is pas zichtbaar als er aan een meeting wordt deelgenomen',
      enabled: 'Zet het raster aan',
      sourceCode: 'Broncode is beschikbaar op Github',
      screenCaptureMode: 'Zet Screen Capture Mode aan',
      screenCaptureModeDescription: "Forceer 16:9, Schakel namen uit, Zet video's vast op hun plek",
    },
    pl: {
      showOnlyVideo: 'Pokaż tylko uczestników z wideo',
      highlightSpeaker: 'Wyróżnij osobę prezentującą',
      includeOwnVideo: 'Uwzględnij siebie',
    },
    pt: {
      showOnlyVideo: 'Mostrar apenas participantes com vídeo',
      highlightSpeaker: 'Realçar quem está a falar',
      includeOwnVideo: 'Incluir o meu vídeo na grelha',
      autoEnable: 'Ativar visualização em grelha por defeito',
      notRunning: 'Visualização em grelha não está activada nesta página',
      noMeeting: 'Visualização em grelha não funciona até que entre numa conferência',
      enabled: 'Ativar visualização em grelha',
      sourceCode: 'Código fonte disponível no Github',
      screenCaptureMode: 'Ativar captura de ecrã',
      screenCaptureModeDescription: 'Forçar aspeto 16:9, Remover nomes, Parar posição dos vídeos',
      unauthorizedWarning: `Por favor, clique aqui para instalar a versão oficial.`,
    },
    'pt-BR': {
      showOnlyVideo: 'Mostrar somente participantes com vídeo',
      highlightSpeaker: 'Destacar quem está falando',
      includeOwnVideo: 'Incluir meu vídeo no grid',
      autoEnable: 'Habilitar visualização em grid por padrão',
      notRunning: 'Visualização em grid não está habilitado nesta página',
      noMeeting: 'Visualização em grid não funciona até que vocie entre em uma conferência',
      enabled: 'Habilitar visualização em grid',
      sourceCode: 'Código fonte disponível no Github',
      screenCaptureMode: 'Habilitar captura de tela',
      screenCaptureModeDescription: 'Forçar aspecto 16:9, Desabilitar nomes, Travar posição dos vídeos',
      unauthorizedWarning: `Por favor, instale a versão oficial clicando aqui.`,
    },
    ru: {
      showOnlyVideo: 'Показывать участников только с видео',
      highlightSpeaker: 'Подсвечивать участника со звуком',
      includeOwnVideo: 'Включить себя в сетку',
      autoEnable: 'Разрешить вид сетки по умолчанию',
      notRunning: 'Сетка не работает на этой странице',
      noMeeting: 'Сетка не будет работать пока вы не подключитесь к конференции',
      enabled: 'Включить вид сетки',
      sourceCode: 'Исходный код доступен на Github',
      unauthorizedWarning: `Пожалуйста, установите оффициальную версию тут.`,
      hideParticipant: 'Скрыть участника',
      showParticipant: 'Показать участника',
    },
    sv: {
      showOnlyVideo: 'Visa endast deltagare med video',
      highlightSpeaker: 'Markera/följ talare',
      includeOwnVideo: 'Inkludera mig i rutnätet',
      autoEnable: 'Använd rutnätet som standard',
      notRunning: 'Rutnätet körs inte på denna sidan',
      noMeeting: 'Grid View körs inte till dess att du har gått med i mötet',
      enabled: 'Slå på rutnätet',
      sourceCode: 'Källkod tillgänglig på Github',
      screenCaptureMode: 'Slå på skärminspelnings läge',
      screenCaptureModeDescription: 'Tvingar 16:9, Inaktiverar namn, Låser videor på plats',
      unauthorizedWarning: `Installera det officiella tillägget genom att klicka här.`,
    },
    uk: {
      showOnlyVideo: 'Показати лише учасників з відео',
      highlightSpeaker: 'Виділити ведучого',
      includeOwnVideo: 'Включити себе',
    },
    zh: {
      showOnlyVideo: '仅显示有视讯的与会者',
      highlightSpeaker: '强调发言者',
      includeOwnVideo: '将自己的视讯显示于网格中',
    },
    'zh-TW': {
      showOnlyVideo: '僅顯示有視訊的與會者',
      highlightSpeaker: '強調發言者',
      includeOwnVideo: '將自己的視訊顯示於網格中',
    },
  }

  const T = key =>
    navigator.languages
      .concat(['en'])
      .map(l => (translations[l] && translations[l][key]) || (translations[l.split('-')[0]] && translations[l.split('-')[0]][key]))
      .find(t => t)

  return T
}
;(async function () {
  const T = TranslationFactory()

  // Construct HTML
  document.body.classList = 'not-running'
  document.body.innerHTML = `
    <div id="not-running">${T('notRunning')}</div>
    <div id="no-meeting">${T('noMeeting')}</div>
    <label id="enabled">
      <input type="checkbox" />
      ${T('enabled')}
    </label>

    <div class="spacer"></div>

    <label id="show-only-video">
      <input type="checkbox" />
      ${T('showOnlyVideo')}
    </label>
    <label id="highlight-speaker">
      <input type="checkbox" />
      ${T('highlightSpeaker')}
    </label>
    <label id="include-own-video">
      <input type="checkbox" />
      ${T('includeOwnVideo')}
    </label>
    <label id="auto-enable">
      <input type="checkbox" />
      ${T('autoEnable')}
    </label>

    <div class="spacer"></div>

    <label id="screen-capture-mode">
      <input type="checkbox" />
      ${T('screenCaptureMode')}
    </label>
    <small id="screen-capture-mode-desc">${T('screenCaptureModeDescription')}</small>

    <div class="spacer"></div>

    <div id="source-code">
      <small>v${browser.runtime.getManifest().version}</small>
      <a href="https://chrome.google.com/webstore/detail/google-meet-grid-view/kklailfgofogmmdlhgmjgenehkjoioip?authuser=0&hl=en" target="_blank">
        ${T('unauthorizedWarning')}
      </a>
    </div>
  `

  // Get state
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  const state = await browser.tabs.sendMessage(tabs[0].id, { type: 'getState' })
  if (state.error) return

  if (!state.inMeeting) {
    document.body.classList = 'no-meeting'
    return
  }

  document.body.classList = 'in-meeting'
  for (let [k, v] of Object.entries(state.settings)) {
    document.querySelector(`#${k} input`).checked = v
  }

  const updateSettings = () => {
    document.querySelectorAll('label:not(#enabled)').forEach(el => el.classList.toggle('disabled', !state.settings['enabled']))
    document.querySelectorAll('label:not(#enabled) input').forEach(el => (el.disabled = !state.settings['enabled']))

    if (state.settings['enabled']) {
      document.querySelector('#show-only-video input').checked = state.settings['show-only-video'] && !state.settings['screen-capture-mode']
      document.querySelector('#show-only-video input').disabled = state.settings['screen-capture-mode']
      document.querySelector('#show-only-video').classList.toggle('disabled', state.settings['screen-capture-mode'])

      document.querySelector('#highlight-speaker input').checked = state.settings['highlight-speaker'] && !state.settings['screen-capture-mode']
      document.querySelector('#highlight-speaker input').disabled = state.settings['screen-capture-mode']
      document.querySelector('#highlight-speaker').classList.toggle('disabled', state.settings['screen-capture-mode'])
    }
  }

  updateSettings()

  document.querySelectorAll('label').forEach(el => {
    const name = el.id
    el.querySelector('input').onchange = async e => {
      try {
        const response = await browser.tabs.sendMessage(tabs[0].id, { type: 'updateSetting', name, value: e.target.checked })
        if (response.error) throw new Error(response.error)
        state.settings[name] = e.target.checked
        updateSettings()
      } catch {
        e.target.checked = !e.target.checked
      }
    }
  })
})()



/**
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'getState' }, function (response) {
      if (chrome.runtime.lastError || response.error) {
        document.body.classList = 'not-running'
        return
      }
  
      const T = key =>
        response.languages
          .concat(['en'])
          .map(l => (response.translations[l] && response.translations[l][key]) || (response.translations[l.split('-')[0]] && response.translations[l.split('-')[0]][key]))
          .find(t => t)
  
      document.querySelector('#not-running').innerText = T('notRunning')
      document.querySelector('#no-meeting').innerText = T('noMeeting')
      document.querySelector('#enabled span').innerText = T('enabled')
      document.querySelector('#show-only-video span').innerText = T('showOnlyVideo')
      document.querySelector('#highlight-speaker span').innerText = T('highlightSpeaker')
      document.querySelector('#include-own-video span').innerText = T('includeOwnVideo')
      document.querySelector('#auto-enable span').innerText = T('autoEnable')
      document.querySelector('#screen-capture-mode span').innerText = T('screenCaptureMode')
      document.querySelector('#screen-capture-mode small').innerText = T('screenCaptureModeDescription')
      document.querySelector('#source-code').innerText = T('sourceCode')
  
      if (!response.inMeeting) {
        document.body.classList = 'no-meeting'
        return
      }
  
      document.body.classList = 'in-meeting'
      document.querySelector('#enabled input').checked = response.enabled
      document.querySelector('#show-only-video input').checked = response.showOnlyVideo
      document.querySelector('#highlight-speaker input').checked = response.highlightSpeaker
      document.querySelector('#include-own-video input').checked = response.includeOwnVideo
      document.querySelector('#auto-enable input').checked = response.autoEnable
      document.querySelector('#screen-capture-mode input').checked = response.screenCaptureMode
  
      const updateScreenCaptureMode = enabled => {
        document.querySelector('#show-only-video input').checked = !enabled && response.showOnlyVideo
        document.querySelector('#show-only-video input').disabled = enabled
        document.querySelector('#show-only-video').classList.toggle('disabled', enabled)
  
        document.querySelector('#highlight-speaker input').checked = !enabled && response.highlightSpeaker
        document.querySelector('#highlight-speaker input').disabled = enabled
        document.querySelector('#highlight-speaker').classList.toggle('disabled', enabled)
      }
      const setDisabled = v => {
        document.querySelectorAll('label:not(#enabled)').forEach(el => el.classList.toggle('disabled', v))
        document.querySelectorAll('label:not(#enabled) input').forEach(el => (el.disabled = v))
        if (!v) updateScreenCaptureMode(document.querySelector('#screen-capture-mode input').checked)
      }
  
      setDisabled(!response.enabled)
  
      document.querySelectorAll('label').forEach(el => {
        const titleCaseID = el.id
          .split('-')
          .map(s => s.charAt(0).toUpperCase() + s.slice(1))
          .join('')
        const name = titleCaseID.charAt(0).toLowerCase() + titleCaseID.slice(1)
        const type = 'set' + titleCaseID
        el.querySelector('input').onchange = e => {
          chrome.tabs.sendMessage(tabs[0].id, { type, value: e.target.checked }, response => {
            if (chrome.runtime.lastError || response.error) e.target.checked = !e.target.checked
            response[name] = e.target.checked
            if (name === 'enabled') setDisabled(!e.target.checked)
            if (name === 'screenCaptureMode') updateScreenCaptureMode(e.target.checked)
          })
        }
      })
    })
  })
   */