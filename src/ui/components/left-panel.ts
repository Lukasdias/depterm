import { BoxRenderable, TextRenderable, TextAttributes } from "@opentui/core";
import { renderer, state } from "../state.js";
import { colors } from "../colors.js";
import { createSpinner, stopSpinner } from "../spinner.js";
import type { Dependency } from "../../types/index.js";

function getPackageStatus(pkg: Dependency) {
  const outdatedPkg = state.outdated.find((o) => o.name === pkg.name);

  if (!outdatedPkg) {
    return {
      symbol: "●",
      label: "OK",
      latest: pkg.currentVersion,
      isOutdated: false,
      color: colors.yellow[100],
    };
  }

  switch (outdatedPkg.type) {
    case "major":
      return {
        symbol: "●",
        label: "MAJOR",
        latest: outdatedPkg.latest,
        isOutdated: true,
        color: colors.status.major,
      };
    case "minor":
      return {
        symbol: "●",
        label: "MINOR",
        latest: outdatedPkg.latest,
        isOutdated: true,
        color: colors.status.minor,
      };
    case "patch":
      return {
        symbol: "●",
        label: "PATCH",
        latest: outdatedPkg.latest,
        isOutdated: true,
        color: colors.status.patch,
      };
    default:
      return {
        symbol: "○",
        label: "OK",
        latest: pkg.currentVersion,
        isOutdated: false,
        color: colors.yellow[100],
      };
  }
}

export function createLeftPanel(): BoxRenderable {
  const terminalHeight = process.stdout.rows || 24;
  const visibleItems = Math.max(terminalHeight - 12, 8);
  const startIndex = Math.max(0, state.selectedIndex - Math.floor(visibleItems / 2));
  const visibleDeps = state.dependencies.slice(startIndex, startIndex + visibleItems);

  const panel = new BoxRenderable(renderer, {
    id: "left-panel",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    border: true,
    borderColor: colors.ui.border,
  });

  if (state.isLoading) {
    const loadingState = new BoxRenderable(renderer, {
      flexDirection: "column",
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    });
    createSpinner("left-panel-loading", loadingState, "helix", "Loading dependencies...", colors.yellow[300]);
    panel.add(loadingState);
    return panel;
  } else {
    stopSpinner("left-panel-loading");
  }

  const headerRow = new BoxRenderable(renderer, {
    id: "left-panel-header",
    flexDirection: "row",
    padding: 1,
  });
  
  const pkgHeader = new BoxRenderable(renderer, { width: "60%" });
  pkgHeader.add(
    new TextRenderable(renderer, {
      content: "Package",
      attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE,
      fg: colors.yellow[200],
    })
  );
  headerRow.add(pkgHeader);

  const statusHeader = new BoxRenderable(renderer, { 
    width: "15%",
    alignItems: "center",
  });
  statusHeader.add(
    new TextRenderable(renderer, {
      content: "Status",
      attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE,
      fg: colors.yellow[200],
    })
  );
  headerRow.add(statusHeader);

  const versionHeader = new BoxRenderable(renderer, { 
    width: "25%",
    alignItems: "flex-end",
  });
  versionHeader.add(
    new TextRenderable(renderer, {
      content: "Version",
      attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE,
      fg: colors.yellow[200],
    })
  );
  headerRow.add(versionHeader);

  panel.add(headerRow);

  const listContainer = new BoxRenderable(renderer, {
    id: "left-panel-list",
    flexDirection: "column",
    flexGrow: 1,
  });

  for (let i = 0; i < visibleDeps.length; i++) {
    const pkg = visibleDeps[i];
    const actualIndex = startIndex + i;
    const isSelected = actualIndex === state.selectedIndex;
    const status = getPackageStatus(pkg);

    const row = new BoxRenderable(renderer, {
      id: `pkg-row-${pkg.name}`,
      flexDirection: "row",
      padding: 1,
      backgroundColor: isSelected ? colors.ui.selection : undefined,
    });

    const nameCell = new BoxRenderable(renderer, { width: "60%" });
    nameCell.add(
      new TextRenderable(renderer, {
        content: `${isSelected ? "> " : "  "}${pkg.name}`,
        fg: isSelected ? colors.ui.selectionText : colors.yellow[200],
        attributes: isSelected ? TextAttributes.BOLD : TextAttributes.NONE,
      })
    );
    row.add(nameCell);

    const statusCell = new BoxRenderable(renderer, { 
      width: "15%",
      alignItems: "center",
    });
    const statusFg = isSelected ? colors.ui.selectionText : status.color;
    const statusAttrs = !isSelected && status.label === "OK" ? TextAttributes.DIM : TextAttributes.NONE;
    statusCell.add(
      new TextRenderable(renderer, {
        content: `${status.symbol} ${status.label}`,
        fg: statusFg,
        attributes: statusAttrs,
      })
    );
    row.add(statusCell);

    const versionCell = new BoxRenderable(renderer, { 
      width: "25%",
      alignItems: "flex-end",
    });
    versionCell.add(
      new TextRenderable(renderer, {
        content: status.latest,
        fg: isSelected
          ? colors.ui.selectionText
          : status.isOutdated
          ? colors.yellow[100]
          : colors.yellow[400],
      })
    );
    row.add(versionCell);

    listContainer.add(row);
  }

  panel.add(listContainer);

  if (state.dependencies.length > 0) {
    const footer = new BoxRenderable(renderer, {
      id: "left-panel-footer",
      flexDirection: "row",
      padding: 1,
      border: true,
      borderColor: colors.yellow[300],
    });
    footer.add(
      new TextRenderable(renderer, {
        content: `${state.selectedIndex + 1}/${state.dependencies.length} | ${visibleDeps.length} visible | ${state.dependencies.length - state.outdated.length} OK | ${state.outdated.length} update`,
        attributes: TextAttributes.DIM,
        fg: colors.yellow[400],
      })
    );
    panel.add(footer);
  }

  return panel;
}
