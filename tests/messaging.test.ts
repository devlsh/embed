import { page } from 'vitest/browser';
import { fixture } from './helpers/fixture';

describe('Native message guards', () => {
  test.each(['origin', 'source'] as const)(
    'rejects matching-ID packets from a disallowed %s',
    async (rejectionProbe) => {
      const { screen, frame, child, ready, childOrigin } = await fixture({
        id: 'rejection',
        rejectionProbe,
      });

      await expect.element(ready).toHaveTextContent(childOrigin);
      const expectedFrame = frame.element();

      if (!(expectedFrame instanceof HTMLIFrameElement)) {
        throw new Error('Expected native iframe');
      }

      // Navigation preserves the WindowProxy, so origin rejection cannot pass on a source mismatch.
      const expectedWindow = expectedFrame.contentWindow;
      let sender = child;

      if (rejectionProbe === 'origin') {
        await screen.getByRole('button', { name: 'Navigate to rejected origin' }).click();
      } else {
        sender = page.frameLocator(screen.getByTitle('Other client rejection', { exact: true }));
      }

      await sender.getByRole('button', { name: 'Send rejected packets' }).click();

      const rejectedOrigin = rejectionProbe === 'origin' ? `http://localhost:${location.port}` : location.origin;
      const expectedSource = rejectionProbe === 'origin';
      await expect
        .poll(() => screen.emitted('packet'))
        .toEqual([
          [
            {
              payload: 'rejected notice',
              origin: rejectedOrigin,
              expectedSource,
              trusted: true,
            },
          ],
          [
            {
              payload: 'rejection barrier',
              origin: rejectedOrigin,
              expectedSource,
              trusted: true,
            },
          ],
        ]);
      expect(expectedFrame.contentWindow).toBe(expectedWindow);
      expect(screen.emitted('notice')).toBeUndefined();

      if (rejectionProbe === 'origin') {
        await screen.getByRole('button', { name: 'Restore allowed origin' }).click();
        await expect.element(ready).toHaveTextContent(location.origin);
      }

      await child
        .getByRole('button', {
          name: 'Child post',
          exact: true,
        })
        .click();

      await expect
        .poll(() => screen.emitted('child-result'))
        .toEqual([
          [
            {
              notices: ['child notice'],
              reads: 1,
            },
          ],
        ]);
      expect(screen.emitted('notice')).toEqual([['child notice']]);
    },
  );

  test('cross-origin iframe denies parent document access while public RPC remains usable', async () => {
    const { screen, frame, child, ready, childOrigin } = await fixture({
      id: 'smoke',
      crossOrigin: true,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);
    expect(location.hostname).toBe('127.0.0.1');
    expect(childOrigin).not.toBe(location.origin);
    const iframe = frame.element();

    if (!(iframe instanceof HTMLIFrameElement)) {
      throw new Error('Expected native iframe');
    }

    expect(() => iframe.contentWindow?.document).toThrow(expect.objectContaining({ name: 'SecurityError' }));

    await screen
      .getByRole('button', {
        name: 'Host request',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child request',
        exact: true,
      })
      .click();

    await expect.poll(() => screen.emitted('host-result')).toEqual([['child:18']]);
    await expect.poll(() => screen.emitted('child-result')).toEqual([['host:15']]);
  });
});

describe.each([
  {
    name: 'same-origin',
    crossOrigin: false,
  },
  {
    name: 'cross-origin',
    crossOrigin: true,
  },
])('$name events', ({ crossOrigin }) => {
  test('delivers the host notice to the child', async () => {
    const { screen, ready, childOrigin } = await fixture({
      id: 'host-notice',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);
    await screen.getByLabelText('Host payload').fill('from parent: Ada');

    await screen
      .getByRole('button', {
        name: 'Host post',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('history'))
      .toEqual([
        [
          {
            notices: ['from parent: Ada'],
            reads: 1,
          },
        ],
      ]);
    expect(screen.emitted('child-notice')).toEqual([['from parent: Ada']]);
  });

  test('delivers the child notice to the host', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'child-notice',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);
    await child.getByLabelText('Child payload').fill('from child: Lin');

    await child
      .getByRole('button', {
        name: 'Child post',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: ['from child: Lin'],
            reads: 1,
          },
        ],
      ]);
    expect(screen.emitted('notice')).toEqual([['from child: Lin']]);
  });

  test('preserves JSON object payloads in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'objects',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host object',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child object',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('history'))
      .toEqual([
        [
          {
            notices: [{ nested: ['value', 4] }],
            reads: 1,
          },
        ],
      ]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: [{ nested: ['value', 4] }],
            reads: 1,
          },
        ],
      ]);
    expect(screen.emitted('notice')).toEqual([[{ nested: ['value', 4] }]]);
    expect(screen.emitted('child-notice')).toEqual([[{ nested: ['value', 4] }]]);
  });

  test('preserves zero, false and empty-string payloads in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'falsy',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host falsy values',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child falsy values',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('history'))
      .toEqual([
        [
          {
            notices: [0, false, ''],
            reads: 1,
          },
        ],
      ]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: [0, false, ''],
            reads: 1,
          },
        ],
      ]);
    expect(screen.emitted('notice')).toEqual([[0], [false], ['']]);
    expect(screen.emitted('child-notice')).toEqual([[0], [false], ['']]);
  });

  test('delivers Error instances and messages in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'event-errors',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host event error',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child event error',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('child-notice'))
      .toEqual([
        [
          {
            isError: true,
            message: 'Host event error',
          },
        ],
      ]);
    await expect.poll(() => screen.emitted('notice')).toEqual([[new Error('Child event error')]]);
    expect(screen.emitted('notice')?.[0]?.[0]).toBeInstanceOf(Error);
  });

  test('rejects bigint payloads before delivery in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'bigint',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host unserializable',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child unserializable',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('host-result'))
      .toEqual([[new Error('Message cannot be serialized to JSON')]]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([[new Error('Message cannot be serialized to JSON')]]);
    expect(screen.emitted('host-result')?.[0]?.[0]).toBeInstanceOf(Error);
    expect(screen.emitted('child-result')?.[0]?.[0]).toBeInstanceOf(Error);

    await screen
      .getByRole('button', {
        name: 'Host post',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child post',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('history'))
      .toEqual([
        [
          {
            notices: ['host notice'],
            reads: 1,
          },
        ],
      ]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([
        [new Error('Message cannot be serialized to JSON')],
        [
          {
            notices: ['child notice'],
            reads: 1,
          },
        ],
      ]);
    expect(screen.emitted('notice')).toEqual([['child notice']]);
    expect(screen.emitted('child-notice')).toEqual([['host notice']]);
  });
});
