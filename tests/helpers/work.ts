/**
 * Tracks fixture waits for cleanup.
 * A `wait()` without a delay stays pending until `dispose()`.
 * `dispose()` clears timers and resolves all pending waits without rejection.
 * Call `dispose()` during fixture cleanup.
 */
export function work() {
  const pending = new Set<() => void>();

  async function wait(milliseconds?: number) {
    return new Promise<void>((resolve) => {
      let timer: number | undefined;

      function finish() {
        window.clearTimeout(timer);
        pending.delete(finish);
        resolve();
      }

      pending.add(finish);

      if (milliseconds !== undefined) {
        timer = window.setTimeout(finish, milliseconds);
      }
    });
  }

  function dispose() {
    for (const finish of pending) {
      finish();
    }
  }

  return {
    wait,
    dispose,
  };
}
