import { TextRenderable, type BoxRenderable } from "@opentui/core";
import spinners from "unicode-animations";
import { renderer } from "./state.js";

interface ActiveSpinner {
  textRenderable: TextRenderable;
  intervalId: ReturnType<typeof setInterval>;
  frameIndex: number;
  frames: readonly string[];
}

const activeSpinners = new Map<string, ActiveSpinner>();

export function createSpinner(
  id: string,
  parent: BoxRenderable,
  spinnerName: keyof typeof spinners = "helix",
  text = "",
  fg?: string
): TextRenderable {
  const spinner = spinners[spinnerName];
  if (!spinner) {
    throw new Error(`Unknown spinner: ${spinnerName}`);
  }

  const textRenderable = new TextRenderable(renderer, {
    id: `spinner-${id}`,
    content: `${spinner.frames[0]} ${text}`,
    fg: fg || "#FFCC00",
  });

  parent.add(textRenderable);

  const activeSpinner: ActiveSpinner = {
    textRenderable,
    intervalId: setInterval(() => {
      activeSpinner.frameIndex = (activeSpinner.frameIndex + 1) % spinner.frames.length;
      textRenderable.content = `${spinner.frames[activeSpinner.frameIndex]} ${text}`;
    }, spinner.interval),
    frameIndex: 0,
    frames: spinner.frames,
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
