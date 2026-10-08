import { expectTypeOf } from 'vitest';
import { type Ref } from 'vue';
import {
  type useEmbed,
  type AsyncHandler,
  type Context,
  type DefaultEventsMap,
  type Frame,
  type Options,
} from '../src/index';
import { type Events } from './helpers/contracts';

function consumer(context: Context<Events>) {
  const reply = context.send<{ total: number }>('calculate', { value: 4 });
  const remove = context.handle<{ value: number }>('calculate', async ({ value }) => value * 2);

  const unsubscribe = context.events.on('ready', (origin) => {
    expectTypeOf(origin).toEqualTypeOf<string>();
  });

  return {
    reply,
    remove,
    unsubscribe,
  };
}

test('exports typed iframe, options, context, handlers and events', () => {
  expectTypeOf<Frame>().toEqualTypeOf<Ref<HTMLIFrameElement | undefined>>();
  expectTypeOf<Options['iframe']>().toEqualTypeOf<Frame | undefined>();
  expectTypeOf<Options['timeout']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<Options['remote']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Options['id']>().toEqualTypeOf<string>();
  expectTypeOf<DefaultEventsMap['_loaded']>().toEqualTypeOf<() => void>();
  expectTypeOf<ReturnType<typeof useEmbed<Events>>>().toEqualTypeOf<Context<Events>>();
  expectTypeOf<AsyncHandler<{ value: number }, string>>().toEqualTypeOf<
    (payload: { value: number }) => Promise<string>
  >();
  expectTypeOf(consumer).returns.toHaveProperty('reply').toEqualTypeOf<Promise<{ total: number }>>();
  expectTypeOf(consumer).returns.toHaveProperty('remove').toEqualTypeOf<() => void>();
  expectTypeOf(consumer).returns.toHaveProperty('unsubscribe').toEqualTypeOf<() => void>();
});
