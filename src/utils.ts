/**
 * Generates a random integer ID for async IPC messages.
 */
export function generateId() {
  return Math.floor(Math.random() * 1000000) + 1;
}
