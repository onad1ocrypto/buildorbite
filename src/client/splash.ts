// The package's browser export includes this API at runtime, but its conditional
// TypeScript declaration currently resolves to the server-only panic stub.
// @ts-expect-error requestExpandedMode is present in the Devvit browser client export.
import { requestExpandedMode } from '@devvit/web/client';

const playButton = document.querySelector<HTMLButtonElement>('#play-button');
const hint = document.querySelector<HTMLParagraphElement>('#play-hint');

playButton?.addEventListener('click', (event) => {
  // Expanded mode must be requested directly from a trusted user gesture.
  requestExpandedMode(event, 'run');
  if (hint) hint.textContent = 'Loading the game…';
});
