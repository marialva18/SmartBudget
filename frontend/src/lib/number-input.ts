import type { WheelEvent } from 'react';

export function preventNumberWheelChange(
  event: WheelEvent<HTMLInputElement>,
) {
  event.currentTarget.blur();
}
