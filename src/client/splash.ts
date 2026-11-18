// The package's browser export includes this API at runtime, but its conditional
// TypeScript declaration currently resolves to the server-only panic stub.
// @ts-expect-error requestExpandedMode is present in the Devvit browser client export.
import { requestExpandedMode } from '@devvit/web/client';

const demoButton = document.querySelector<HTMLButtonElement>('#demo-button');
if (demoButton) {
  demoButton.hidden = false;
  demoButton.addEventListener('click', (event) => {
    // Open the title screen without starting a ticket-consuming run.
    requestExpandedMode(event, 'game');
  });
}

const playButton = document.querySelector<HTMLButtonElement>('#play-button');
const hint = document.querySelector<HTMLParagraphElement>('#play-hint');

playButton?.addEventListener('click', (event) => {
  // Expanded mode must be requested directly from a trusted user gesture.
  requestExpandedMode(event, 'run');
  if (hint) hint.textContent = 'Loading the game…';
});
