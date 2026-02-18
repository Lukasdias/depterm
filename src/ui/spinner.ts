import { TextRenderable, type BoxRenderable } from "@opentui/core";
import { renderer } from "./state.js";

interface ActiveSpinner {
  textRenderable: TextRenderable;
  intervalId: ReturnType<typeof setInterval>;
  frameIndex: number;
  frames: string[];
}

const activeSpinners = new Map<string, ActiveSpinner>();

const HELIX_FRAMES = ["⣾", "⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽"];
const SPINNER_INTERVAL = 80;

export function createSpinner(
  id: string,
  parent: BoxRenderable,
  _spinnerName?: string,
  text = "",
  fg?: string
): TextRenderable {
  const frames = HELIX_FRAMES;

  const textRenderable = new TextRenderable(renderer, {
    id: `spinner-${id}`,
    content: `${frames[0]} ${text}`,
    fg: fg || "#FFCC00",
  });

  parent.add(textRenderable);

  const activeSpinner: ActiveSpinner = {
    textRenderable,
    intervalId: setInterval(() => {
      activeSpinner.frameIndex = (activeSpinner.frameIndex + 1) % frames.length;
      textRenderable.content = `${frames[activeSpinner.frameIndex]} ${text}`;
    }, SPINNER_INTERVAL),
    frameIndex: 0,
    frames,
  };

  activeSpinners.set(id, activeSpinner);

  return textRenderable;
}

export function updateSpinnerText(id: string, newText: string): void {
  const spinner = activeSpinners.get(id);
  if (spinner) {
    const currentFrame = spinner.frames[spinner.frameIndex];
    spinner.textRenderable.content = `${currentFrame} ${newText}`;
  }
}

export function stopSpinner(id: string, finalText?: string): void {
  const spinner = activeSpinners.get(id);
  if (spinner) {
    clearInterval(spinner.intervalId);
    if (finalText) {
      spinner.textRenderable.content = finalText;
    }
    activeSpinners.delete(id);
  }
}

export function stopAllSpinners(): void {
  for (const [, spinner] of activeSpinners) {
    clearInterval(spinner.intervalId);
  }
  activeSpinners.clear();
}
