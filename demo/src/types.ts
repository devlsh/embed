import { type DefaultEventsMap } from '../../src';

export interface DemoEvents extends DefaultEventsMap {
  dummy: (payload: number) => void;
}
