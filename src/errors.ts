export const errPrefix = '_embedError:';

export function encodeErr(e: Error) {
  return `${errPrefix}${e.message}`;
}

export function decodeErr(str: string) {
  return new Error(str.replace(errPrefix, ''));
}

export function isErr(str: unknown): str is `${typeof errPrefix}${string}` {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- IPC values can be non-strings; validate the encoded error prefix here.
  return typeof str === 'string' && str.indexOf(errPrefix) === 0;
}
