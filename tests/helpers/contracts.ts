import { type DefaultEventsMap } from '../../src/index';

export interface Request {
  value: number;
}

export type Reply = string | History | { values: string[]; completion: string[] };

export interface ErrorReceipt {
  isError: true;
  message: string;
}

export interface Events extends DefaultEventsMap {
  ready: (origin: string) => void;
  result: (result: Reply) => void;
  failure: (error: Error) => void;
  received: (payload: Exclude<Parameters<Events['notice']>[0], Error> | ErrorReceipt) => void;
  notice: (payload: string | number | boolean | { nested: (string | number)[] } | Error) => void;
}

export interface History {
  notices: unknown[];
  reads: number;
}

export interface HostProps {
  id: string;
  crossOrigin?: boolean;
  rejectionProbe?: 'origin' | 'source';
}
