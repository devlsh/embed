import { createLogger } from '@devlsh/logger';
import { createNanoEvents, type DefaultEvents } from 'nanoevents';
import type { WatchStopHandle } from 'vue';

import { decodeErr, encodeErr, isErr } from '@/errors';
import { generateId } from '@/helpers';
import type { AsyncHandler, Context, DefaultEventsMap, Mode, Options, PostObject, Promises, Type } from '@/types';

const register: Record<string, Context<DefaultEvents & DefaultEventsMap>> = {};
const handlers: Record<string, Record<string, AsyncHandler>> = {};
const promises: Promises = {};

const processMessage = async (e: MessageEvent<PostObject>) => {
  if (localStorage.getItem('debug_ipc') === 'true') {
    console.log('raw postmessage', e);
  }

  if (
    !e.data ||
    !e.data.id ||
    !register[e.data.id] ||
    /**
     * Check the origin, if one was supplied.
     * Sandboxed iFrames without the `allow-same-origin` permission
     * will return `"null"` as an origin, so in that case we cannot
     * enforce it.
     */
    ((register[e.data.id].remote ?? '*') !== '*' && e.origin !== 'null' && !e.origin.startsWith(register[e.data.id].remote as string)) ||
    // If this is the Host, ensure the source is the iFrame Element.
    (register[e.data.id].mode === 'host' && e.source !== register[e.data.id].iframe?.value?.contentWindow)
  ) {
    return;
  }

  const { id, type, payload } = e.data;
  const { events, post, logger } = register[id];

  if (type === '_async') {
    // Process incoming async executions.
    let response: Error | unknown;

    try {
      if (!handlers[id] || !handlers[id][payload.type]) {
        throw new Error(`no handler for event "${payload.type}"`);
      }

      logger.debug('processing async request', payload);
      response = await handlers[id][payload.type](payload.message);
    } catch (e) {
      logger.debug('sending error response', payload, e);
      response = encodeErr(e as Error);
    }

    post('_asyncResponse', { id: payload.id, response });
  } else if (type === '_asyncResponse' && promises[id] && promises[id][payload.id]) {
    /**
     * Process the response from async executions.
     * This just means taking the response and resolving/rejecting
     * the stored promise.
     */
    const promise = promises[id][payload.id];

    window.clearTimeout(promise.timeout);

    logger.debug(`#${payload.id} processing incoming async response`, payload);

    if (isErr(payload.response)) {
      promise.reject(decodeErr(payload.response));
    } else {
      promise.resolve(payload.response);
    }

    delete promises[id][payload.id];
  } else {
    // Otherwise it's a regular event, so emit it to any listeners.
    let message = payload;

    if (isErr(message)) {
      message = decodeErr(message);
    }

    logger.debug(`emitting sync event \`${type}\``, message);
    events.emit(type, message);
  }
};

export function useEmbed<Events extends DefaultEventsMap>(mode: Mode, options: Options) {
  if (register[options.id]) {
    return register[options.id] as Context<Events>;
  }

  const logger = createLogger({ name: `embed/${mode}` });
  const events = createNanoEvents<Events>();
  const isHost = mode === 'host';
  let target: Window | null = window.parent;
  let watcher: WatchStopHandle | undefined;

  if (options.debug !== true) {
    logger.setDisabled(true);
  }

  const post = (type: Type, message?: any) => {
    if (!target) {
      throw new Error('Target Window is unloaded');
    }

    let remote = '*';

    try {
      const origin = target.origin;

      if (origin && options.remote) {
        remote = options.remote;
      }
    } catch (e) {
      // Do nothing.
    }

    if (message instanceof Error) {
      message = encodeErr(message);
    }

    try {
      // Ensure the message is serializable to JSON.
      message = JSON.parse(JSON.stringify(message ?? {}));
    } catch {
      throw new Error('Message cannot be serialized to JSON');
    }

    logger.debug(`sending synchronous event \`${type}\` to \`${remote}\``, message);

    target.postMessage(
      {
        id: options.id,
        type,
        payload: message ?? {},
      },
      remote,
    );
  };

  const send = async <R = any>(type: Type, message?: any): Promise<R> => {
    return new Promise((resolve, reject) => {
      const id = generateId();

      if (!promises[options.id]) {
        promises[options.id] = {};
      }

      promises[options.id][id] = {
        resolve: (response: any) => {
          logger.debug(`#${id} received response`, response);
          resolve(response);
        },
        reject: (err: Error) => {
          logger.debug(`#${id} received error`, err);
          reject(err);
        },
        timeout: window.setTimeout(() => {
          logger.debug(`#${id} timed out`);
          reject(new Error('Timed out'));
          delete promises[options.id][id];
        }, options.timeout ?? 15000),
      };

      logger.debug(`#${id} requesting async payload \`${type}\``, message);

      post('_async', {
        id,
        type,
        message: message ?? {},
      });
    });
  };

  const handle = <P = any>(type: Type, callback: AsyncHandler<P>) => {
    if (!handlers[options.id]) {
      handlers[options.id] = {};
    }

    handlers[options.id][type] = callback;

    return () => {
      logger.debug(`de-registering handler for event \`${type}\``);
      delete handlers[options.id][type];
    };
  };

  if (isHost && !options.iframe) {
    throw new Error('"host" mode requires an iFrame reference');
  }

  const destroy = () => {
    logger.debug(`destroying ${mode}`);

    if (watcher) {
      watcher();
    }

    events.events = {};
    delete register[options.id];
    delete promises[options.id];
    delete handlers[options.id];

    if (!Object.keys(register).length) {
      window.removeEventListener('message', processMessage);
    }
  };

  const context: Context<Events> = {
    mode,
    post,
    send,
    handle,
    destroy,
    events,
    iframe: options.iframe,
    remote: options.remote,
    logger,
  };

  register[options.id] = context;

  if (Object.keys(register).length === 1) {
    window.addEventListener('message', processMessage);
  }

  if (isHost) {
    events.on('_ek-loaded', () => {
      const targetWindow = context.iframe?.value?.contentWindow ?? null;

      if (targetWindow) {
        logger.debug('client sent ready event');
        target = targetWindow;
      } else {
        logger.error('client sent ready event, but no contentWindow was found');
      }
    });
  } else {
    post('_ek-loaded');
  }

  logger.debug(`${mode} mode IPC registered`, { options });

  return context as Context<Events>;
}

export * from './types';
