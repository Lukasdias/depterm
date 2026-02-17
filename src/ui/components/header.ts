import { BoxRenderable, TextRenderable, TextAttributes } from "@opentui/core";
import { renderer, state, truncatePath, getManagerIcon } from "../state.js";
import { colors } from "../colors.js";
import { createSpinner } from "../spinner.js";

export function createHeader(): BoxRenderable {
  const outdatedCount = state.outdated.length;
  const conflictCount = state.conflicts.length;
  const statusColor =
    conflictCount > 0 ? colors.status.error : outdatedCount > 0 ? colors.yellow[200] : colors.yellow[100];

  const header = new BoxRenderable(renderer, {
    id: "header",
    flexDirection: "row",
    width: "100%",
    border: true,
    borderColor: colors.ui.border,
    padding: 1,
  });

  const leftSection = new BoxRenderable(renderer, {
    id: "header-left",
    width: "15%",
  });
  leftSection.add(
    new TextRenderable(renderer, {
      id: "header-title",
      content: "depterm",
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );
  if (state.isLoading) {
    createSpinner("header-loading", leftSection, "helix", "", colors.yellow[200]);
  }
  header.add(leftSection);

  const centerSection = new BoxRenderable(renderer, {
    id: "header-center",
    width: "50%",
  });
  centerSection.add(
    new TextRenderable(renderer, {
      id: "header-path",
      content: `${getManagerIcon(state.packageManager)} ${state.packageManager} | ${truncatePath(state.projectPath, 35)}`,
      attributes: TextAttributes.DIM,
      fg: colors.yellow[400],
    })
  );
  header.add(centerSection);

  header.add(new BoxRenderable(renderer, { id: "header-spacer", flexGrow: 1 }));

  const rightSection = new BoxRenderable(renderer, {
    id: "header-right",
  });
  rightSection.add(
    new TextRenderable(renderer, {
      id: "header-stats",
      content: `${state.dependencies.length} deps | ${outdatedCount} outdated | ${conflictCount} issues`,
      fg: statusColor,
    })
  );
  header.add(rightSection);

  return header;
}
