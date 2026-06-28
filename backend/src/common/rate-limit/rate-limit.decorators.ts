import { Throttle } from '@nestjs/throttler';

const ONE_MINUTE_MS = 60_000;

export const WriteThrottle = () =>
  Throttle({ default: { limit: 30, ttl: ONE_MINUTE_MS } });

export const CoachThrottle = () =>
  Throttle({ default: { limit: 10, ttl: ONE_MINUTE_MS } });
