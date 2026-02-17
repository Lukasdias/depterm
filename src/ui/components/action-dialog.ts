import { BoxRenderable, TextRenderable, TextAttributes } from "@opentui/core";
import { renderer, state } from "../state.js";
import { colors, getUpdateTypeColor } from "../colors.js";
import { formatAuthor } from "../../core/package-info.js";

interface UpgradeOption {
  key: string;
  label: string;
  desc: string;
  type: "patch" | "minor" | "major" | "latest" | "dry-run";
  targetVersion?: string;
}

function getUpgradeOptions(outdatedInfo: { latest: string; wanted: string } | undefined, currentVersion: string): UpgradeOption[] {
  const options: UpgradeOption[] = [];

  if (outdatedInfo) {
    options.push({
      key: "1",
      label: "Patch",
      desc: `→ ${outdatedInfo.wanted}`,
      type: "patch",
      targetVersion: outdatedInfo.wanted,
    });
    options.push({
      key: "2",
      label: "Minor",
      desc: `→ ${outdatedInfo.wanted}`,
      type: "minor",
      targetVersion: outdatedInfo.wanted,
    });
    options.push({
      key: "3",
      label: "Major",
      desc: `→ ${outdatedInfo.latest}`,
      type: "major",
      targetVersion: outdatedInfo.latest,
    });
    options.push({
      key: "4",
      label: "Latest",
      desc: `→ ${outdatedInfo.latest}`,
      type: "latest",
      targetVersion: outdatedInfo.latest,
    });
  }

  options.push({
    key: "d",
    label: "Dry Run",
    desc: "Preview without installing",
    type: "dry-run",
  });

  return options;
}

export function createActionDialog(): BoxRenderable {
  const selectedDep = state.dependencies[state.selectedIndex];
  const outdatedInfo = state.outdated.find((o) => o.name === selectedDep?.name);
  const metadata = state.packageMetadata.get(selectedDep?.name || "");
  const { selectedIndex, isUpgrading } = state.actionDialog;

  const upgradeOptions = getUpgradeOptions(outdatedInfo, selectedDep?.currentVersion || "");

  const overlay = new BoxRenderable(renderer, {
    id: "action-dialog-overlay",
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  });

  const backdrop = new BoxRenderable(renderer, {
    id: "action-dialog-backdrop",
    flexDirection: "column",
    width: "65%",
    height: "auto",
    border: true,
    borderStyle: "double",
    borderColor: colors.yellow[100],
    backgroundColor: "#1a1a1a",
    padding: 2,
  });

  backdrop.add(
    new TextRenderable(renderer, {
      content: "UPGRADE PACKAGE",
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[100],
    })
  );

  backdrop.add(new TextRenderable(renderer, { content: "" }));

  const pkgInfo = new BoxRenderable(renderer, {
    flexDirection: "column",
    padding: 1,
    border: true,
    borderColor: colors.yellow[400],
  });

  pkgInfo.add(
    new TextRenderable(renderer, {
      content: selectedDep?.name || "Unknown",
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );

  pkgInfo.add(new TextRenderable(renderer, { content: "" }));

  if (metadata?.description) {
    const descLines = metadata.description.slice(0, 60).split(" ");
    let line = "";
    for (const word of descLines) {
      if ((line + " " + word).trim().length <= 55) {
        line = (line + " " + word).trim();
      } else {
        if (line) {
          pkgInfo.add(
            new TextRenderable(renderer, {
              content: line,
              fg: colors.yellow[400],
              attributes: TextAttributes.DIM,
            })
          );
        }
        line = word;
      }
    }
    if (line) {
      pkgInfo.add(
        new TextRenderable(renderer, {
          content: line,
          fg: colors.yellow[400],
          attributes: TextAttributes.DIM,
        })
      );
    }
    pkgInfo.add(new TextRenderable(renderer, { content: "" }));
  }

  const author = metadata ? formatAuthor(metadata.author) : null;
  if (author) {
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: `Author: ${author}`,
        fg: colors.yellow[300],
      })
    );
  }

  if (outdatedInfo) {
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: `Current: ${selectedDep?.currentVersion}`,
        fg: colors.yellow[400],
      })
    );
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: `Wanted: ${outdatedInfo.wanted}`,
        fg: colors.yellow[300],
      })
    );
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: `Latest:  ${outdatedInfo.latest}`,
        attributes: TextAttributes.BOLD,
        fg: colors.yellow[100],
      })
    );

    const updateType = outdatedInfo.type;
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: `Update: ${updateType.toUpperCase()}`,
        attributes: TextAttributes.BOLD,
        fg: getUpdateTypeColor(updateType),
      })
    );
  } else {
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: `Version: ${selectedDep?.currentVersion}`,
        fg: colors.yellow[300],
      })
    );
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: "Status: Up to date",
        fg: colors.yellow[100],
      })
    );
  }

  backdrop.add(pkgInfo);
  backdrop.add(new TextRenderable(renderer, { content: "" }));

  backdrop.add(
    new TextRenderable(renderer, {
      content: "AVAILABLE ACTIONS",
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );

  const optionsSection = new BoxRenderable(renderer, {
    flexDirection: "column",
    border: true,
    borderColor: colors.yellow[300],
    padding: 1,
  });

  for (let i = 0; i < upgradeOptions.length; i++) {
    const option = upgradeOptions[i];
    const isSelected = i === selectedIndex;
    const isBlocked = option.type === "major" && state.safeMode;

    const optionRow = new BoxRenderable(renderer, {
      flexDirection: "row",
    });

    optionRow.add(
      new TextRenderable(renderer, {
        content: isSelected ? "▶" : " ",
        fg: colors.yellow[100],
      })
    );

    optionRow.add(
      new TextRenderable(renderer, {
        content: `[${option.key}]`,
        width: 4,
        fg: isBlocked ? colors.yellow[500] : colors.yellow[300],
      })
    );

    optionRow.add(
      new TextRenderable(renderer, {
        content: option.label,
        width: 10,
        fg: isBlocked ? colors.yellow[500] : isSelected ? colors.yellow[100] : colors.yellow[200],
        attributes: isBlocked ? TextAttributes.DIM : TextAttributes.NONE,
      })
    );

    optionRow.add(
      new TextRenderable(renderer, {
        content: option.desc,
        fg: isBlocked ? colors.yellow[500] : colors.yellow[400],
        attributes: TextAttributes.DIM,
      })
    );

    if (option.type === "major" && isBlocked) {
      optionRow.add(
        new TextRenderable(renderer, {
          content: "[BLOCKED]",
          fg: colors.yellow[500],
          attributes: TextAttributes.DIM,
        })
      );
    }

    optionsSection.add(optionRow);
  }

  backdrop.add(optionsSection);

  if (state.safeMode) {
    backdrop.add(new TextRenderable(renderer, { content: "" }));
    backdrop.add(
      new TextRenderable(renderer, {
        content: "Safe Mode: Major upgrades blocked (Press S to toggle)",
        fg: colors.yellow[400],
        attributes: TextAttributes.DIM,
      })
    );
  }

  backdrop.add(new TextRenderable(renderer, { content: "" }));

  const helpSection = new BoxRenderable(renderer, {
    flexDirection: "row",
    justifyContent: "space-between",
  });
  helpSection.add(
    new TextRenderable(renderer, {
      content: "↑↓ Navigate",
      fg: colors.yellow[500],
      attributes: TextAttributes.DIM,
    })
  );
  helpSection.add(
    new TextRenderable(renderer, {
      content: "Enter Confirm",
      fg: colors.yellow[500],
      attributes: TextAttributes.DIM,
    })
  );
  helpSection.add(
    new TextRenderable(renderer, {
      content: "Esc Cancel",
      fg: colors.yellow[500],
      attributes: TextAttributes.DIM,
    })
  );
  backdrop.add(helpSection);

  if (isUpgrading) {
    backdrop.add(new TextRenderable(renderer, { content: "" }));
    backdrop.add(
      new TextRenderable(renderer, {
        content: "⟳ Upgrading...",
        fg: colors.yellow[200],
      })
    );
  }

  overlay.add(backdrop);

  return overlay;
}
