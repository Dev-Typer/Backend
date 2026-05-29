import { randomUUID } from 'crypto';
import type { Request } from 'express';

type StoreCallback = (err: Error | null, state: string) => void;
type VerifyCallback = (err: Error | null, valid: boolean) => void;

export class UUIDStateStore {
  store(req: Request, callback: StoreCallback): void {
    const state = randomUUID();
    const session = req.session as Record<string, any>;
    session.oauthStates ??= [];
    session.oauthStates.push(state);
    callback(null, state);
  }

  verify(req: Request, providedState: string, callback: VerifyCallback): void {
    const states: string[] = (req.session as Record<string, any>).oauthStates ?? [];
    const index = states.indexOf(providedState);
    if (index === -1) {
      callback(null, false);
      return;
    }
    states.splice(index, 1);
    callback(null, true);
  }
}
