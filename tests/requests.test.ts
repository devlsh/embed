import { fixture } from './helpers/fixture';

describe.each([
  {
    name: 'same-origin',
    crossOrigin: false,
  },
  {
    name: 'cross-origin',
    crossOrigin: true,
  },
])('$name requests', ({ crossOrigin }) => {
  test('host receives the child handler response', async () => {
    const { screen, ready, childOrigin } = await fixture({
      id: 'host-request',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host request',
        exact: true,
      })
      .click();

    await expect.poll(() => screen.emitted('host-result')).toEqual([['child:18']]);
  });

  test('child receives the host handler response', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'child-request',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await child
      .getByRole('button', {
        name: 'Child request',
        exact: true,
      })
      .click();

    await expect.poll(() => screen.emitted('child-result')).toEqual([['host:15']]);
  });

  test('correlates concurrent requests despite reversed reply order in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'correlation',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host concurrent',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child concurrent',
        exact: true,
      })
      .click();

    await expect
      .poll(() => screen.emitted('host-result'))
      .toEqual([
        [
          {
            values: ['child:13', 'child:20'],
            completion: ['child:20', 'child:13'],
          },
        ],
      ]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([
        [
          {
            values: ['host:6', 'host:27'],
            completion: ['host:27', 'host:6'],
          },
        ],
      ]);
  });

  test('rejects with the remote Error instance and message in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'errors',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host error',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child error',
        exact: true,
      })
      .click();

    await expect.poll(() => screen.emitted('host-result')).toEqual([[new Error('Child refused request')]]);
    await expect.poll(() => screen.emitted('child-result')).toEqual([[new Error('Host refused request')]]);
    expect(screen.emitted('host-result')?.[0]?.[0]).toBeInstanceOf(Error);
    expect(screen.emitted('child-result')?.[0]?.[0]).toBeInstanceOf(Error);
  });

  test('recovers after the 200ms timeout and settled late replies in both directions', async () => {
    const { screen, child, ready, childOrigin } = await fixture({
      id: 'timeout',
      crossOrigin,
    });

    await expect.element(ready).toHaveTextContent(childOrigin);

    await screen
      .getByRole('button', {
        name: 'Host timeout',
        exact: true,
      })
      .click();
    await child
      .getByRole('button', {
        name: 'Child timeout',
        exact: true,
      })
      .click();

    await expect.poll(() => screen.emitted('host-result')).toEqual([[new Error('Timed out')], ['child recovered']]);
    await expect.poll(() => screen.emitted('child-result')).toEqual([[new Error('Timed out')], ['host recovered']]);
    expect(screen.emitted('host-result')?.[0]?.[0]).toBeInstanceOf(Error);
    expect(screen.emitted('child-result')?.[0]?.[0]).toBeInstanceOf(Error);

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

    await expect
      .poll(() => screen.emitted('host-result'))
      .toEqual([[new Error('Timed out')], ['child recovered'], ['child:18']]);
    await expect
      .poll(() => screen.emitted('child-result'))
      .toEqual([[new Error('Timed out')], ['host recovered'], ['host:15']]);
  });
});
