import { BoxRenderable, TextRenderable, TextAttributes } from "@opentui/core";
import { renderer, state } from "../state.js";
import { colors } from "../colors.js";

export function createFooter(): BoxRenderable {
  const footer = new BoxRenderable(renderer, {
    id: "footer",
    flexDirection: "row",
    width: "100%",
    border: true,
    borderColor: colors.ui.border,
    padding: 1,
  });

  const keybindings =
    state.focusMode === "list"
      ? "↑↓ Navigate | Tab Focus | Enter Action | R Refresh | Q Quit"
      : "↑↓ Select Action | Enter Execute | Tab Back | Q Quit";

  footer.add(
    new TextRenderable(renderer, {
      content: keybindings,
      attributes: TextAttributes.DIM,
      fg: colors.yellow[400],
    })
  );

  footer.add(new BoxRenderable(renderer, { flexGrow: 1 }));

  footer.add(
    new TextRenderable(renderer, {
      content: `Safe Mode: ${state.safeMode ? "ON" : "OFF"}`,
      fg: state.safeMode ? colors.yellow[100] : colors.yellow[200],
    })
  );

  return footer;
}
