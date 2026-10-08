import { useEmbed } from '../src/index';
import { fixture } from './helpers/fixture';

describe('Connection lifecycle', () => {
  test('rejects a missing iframe without preventing a valid connection with the same ID', async () => {
    expect(() => useEmbed('host', { id: 'invalid-host' })).toThrow('"host" mode requires an iFrame reference');
    const { screen, child, ready, childOrigin } = await fixture({ id: 'invalid-host' });
    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host request',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child post',
        exact: true,
      })
      .click();

    await expect.poll(() => screen.emitted('host-result')).toEqual([['child:18']]);
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
  });

  test('isolates concurrent traffic for two simultaneous IDs', async () => {
    const first = await fixture({
      id: 'first',
      crossOrigin: true,
    });

    const second = await fixture({
      id: 'second',
      crossOrigin: true,
    });

    await expect.element(first.ready).toHaveTextContent(first.childOrigin);
    await expect.element(second.ready).toHaveTextContent(second.childOrigin);
    await first.child.getByLabelText('Child payload').fill('first child');
    await second.child.getByLabelText('Child payload').fill('second child');
    await first.screen.getByLabelText('Host payload').fill('first parent');
    await second.screen.getByLabelText('Host payload').fill('second parent');

    await first.screen
      .getByRole('button', {
        name: 'Host concurrent',
        exact: true,
      })
      .click();
    await second.screen
      .getByRole('button', {
        name: 'Host concurrent',
        exact: true,
      })
      .click();
    await first.child
      .getByRole('button', {
        name: 'Child post',
        exact: true,
      })
      .click();
    await second.child
      .getByRole('button', {
        name: 'Child post',
        exact: true,
      })
      .click();
    await first.screen
      .getByRole('button', {
        name: 'Host post',
        exact: true,
      })
      .click();
    await second.screen
      .getByRole('button', {
        name: 'Host post',
        exact: true,
      })
      .click();

    await expect
      .poll(() => first.screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: ['first child'],
            reads: 1,
          },
        ],
      ]);
    await expect
      .poll(() => second.screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: ['second child'],
            reads: 1,
          },
        ],
      ]);
    await expect
      .poll(() => first.screen.emitted('history'))
      .toEqual([
        [
          {
            notices: ['first parent'],
            reads: 1,
          },
        ],
      ]);
    await expect
      .poll(() => second.screen.emitted('history'))
      .toEqual([
        [
          {
            notices: ['second parent'],
            reads: 1,
          },
        ],
      ]);
    await expect
      .poll(() => first.screen.emitted('host-result'))
      .toEqual([
        [
          {
            values: ['child:13', 'child:20'],
            completion: ['child:20', 'child:13'],
          },
        ],
      ]);
    await expect
      .poll(() => second.screen.emitted('host-result'))
      .toEqual([
        [
          {
            values: ['child:13', 'child:20'],
            completion: ['child:20', 'child:13'],
          },
        ],
      ]);
    expect(first.screen.emitted('notice')).toEqual([['first child']]);
    expect(second.screen.emitted('notice')).toEqual([['second child']]);
    expect(first.screen.emitted('child-notice')).toEqual([['first parent']]);
    expect(second.screen.emitted('child-notice')).toEqual([['second parent']]);
  });

  test('remounts a settled connection with the same ID without duplicate listeners', async () => {
    const first = await fixture({
      id: 'remount',
      crossOrigin: true,
    });

    await expect.element(first.ready).toHaveTextContent(first.childOrigin);
    await first.child
      .getByRole('button', {
        name: 'Child post',
        exact: true,
      })
      .click();
    await expect
      .poll(() => first.screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: ['child notice'],
            reads: 1,
          },
        ],
      ]);
    expect(first.screen.emitted('notice')).toEqual([['child notice']]);

    await first.screen.unmount();

    const fresh = await fixture({
      id: 'remount',
      crossOrigin: true,
    });

    await expect.element(fresh.ready).toHaveTextContent(fresh.childOrigin);
    await fresh.child.getByLabelText('Child payload').fill('fresh child');

    await fresh.child
      .getByRole('button', {
        name: 'Child post',
        exact: true,
      })
      .click();
    await fresh.screen
      .getByRole('button', {
        name: 'Host request',
        exact: true,
      })
      .click();

    await expect
      .poll(() => fresh.screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: ['fresh child'],
            reads: 1,
          },
        ],
      ]);
    await expect.poll(() => fresh.screen.emitted('host-result')).toEqual([['child:18']]);
    expect(fresh.screen.emitted('notice')).toEqual([['fresh child']]);
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
])('$name deregistration', ({ crossOrigin }) => {
  test('removes request handlers in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'handlers',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);
    await screen
      .getByRole('button', {
        name: 'Request child handler',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Request host handler',
        exact: true,
      })
      .click();
    await expect.poll(() => screen.emitted('host-result')).toEqual([['child removable']]);
    await expect.poll(() => screen.emitted('child-result')).toEqual([['host removable']]);

    await child
      .getByRole('button', {
        name: 'Remove child handler',
        exact: true,
      })
      .click();
    await screen
      .getByRole('button', {
        name: 'Remove host handler',
        exact: true,
      })
      .click();
    await screen
      .getByRole('button', {
        name: 'Request child handler',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Request host handler',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('host-result'))
      .toEqual([['child removable'], [new Error('no handler for event "removable"')]]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([['host removable'], [new Error('no handler for event "removable"')]]);
    expect(screen.emitted('host-result')?.[1]?.[0]).toBeInstanceOf(Error);
    expect(screen.emitted('child-result')?.[1]?.[0]).toBeInstanceOf(Error);
  });

  test('unsubscribes event listeners in both directions before fresh history barriers', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'unsubscribe',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);
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
        [
          {
            notices: ['child notice'],
            reads: 1,
          },
        ],
      ]);

    await child
      .getByRole('button', {
        name: 'Unsubscribe child',
        exact: true,
      })
      .click();
    await screen
      .getByRole('button', {
        name: 'Unsubscribe host',
        exact: true,
      })
      .click();
    await screen.getByLabelText('Host payload').fill('must not arrive');
    await child.getByLabelText('Child payload').fill('also must not arrive');
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
        [
          {
            notices: ['host notice'],
            reads: 2,
          },
        ],
      ]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([
        [
          {
            notices: ['child notice'],
            reads: 1,
          },
        ],
        [
          {
            notices: ['child notice'],
            reads: 2,
          },
        ],
      ]);
    expect(screen.emitted('notice')).toEqual([['child notice']]);
    expect(screen.emitted('child-notice')).toEqual([['host notice']]);
  });
});
