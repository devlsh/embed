import { onTestFinished } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-vue';
import Host from '../fixtures/Host.vue';
import { type HostProps } from './contracts';

export async function fixture(props: HostProps) {
  const container = document.body.appendChild(document.createElement('div'));
  onTestFinished(() => {
    container.remove();
  });

  // Scope native queries to this render when two hosts coexist.
  const screen = await render(Host, {
    props,
    container,
  });

  const frame = screen.getByTitle(`Client ${props.id}`);
  const child = page.frameLocator(frame);
  const ready = screen.getByRole('status', { name: 'Ready origin' });

  return {
    screen,
    frame,
    child,
    ready,
    childOrigin: props.crossOrigin ? `http://localhost:${location.port}` : location.origin,
  };
}
