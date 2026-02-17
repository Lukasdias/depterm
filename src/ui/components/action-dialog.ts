import { BoxRenderable, TextRenderable, TextAttributes } from "@opentui/core";
import { renderer, state } from "../state.js";
import { colors, getUpdateTypeColor } from "../colors.js";
import { formatAuthor } from "../../core/package-info.js";

interface UpgradeOption {
  key: string;
  label: string;
  desc: string;
  type: "wanted" | "latest" | "dry-run";
}

function getSinglePackageOptions(outdatedInfo: { latest: string; wanted: string } | undefined): UpgradeOption[] {
  const options: UpgradeOption[] = [];
  if (outdatedInfo) {
    options.push({
      key: "w",
      label: "Wanted",
      desc: `${outdatedInfo.wanted} (safe)`,
      type: "wanted",
    });
    options.push({
      key: "l",
      label: "Latest",
      desc: `${outdatedInfo.latest} (may break)`,
      type: "latest",
    });
  }
  options.push({
    key: "d",
    label: "Dry Run",
    desc: "Preview only",
    type: "dry-run",
  });
  return options;
}

function getBatchOptions(): UpgradeOption[] {
  return [
    { key: "w", label: "All Wanted", desc: "Safe updates", type: "wanted" },
    { key: "l", label: "All Latest", desc: "May include breaks", type: "latest" },
    { key: "d", label: "Dry Run", desc: "Preview only", type: "dry-run" },
  ];
}

export function createActionDialog(): BoxRenderable {
  const isBatchMode = state.selectedPackages.size > 0;
  const selectedDep = state.dependencies[state.selectedIndex];
  const outdatedInfo = state.outdated.find((o) => o.name === selectedDep?.name);
  const metadata = state.packageMetadata.get(selectedDep?.name || "");
  const { selectedIndex, isUpgrading } = state.actionDialog;

  const batchPackages = isBatchMode 
    ? state.dependencies.filter(d => state.selectedPackages.has(d.name))
    : [];
  const batchOutdated = isBatchMode
    ? state.outdated.filter(o => state.selectedPackages.has(o.name))
    : [];

  const upgradeOptions = isBatchMode ? getBatchOptions() : getSinglePackageOptions(outdatedInfo);

  const overlay = new BoxRenderable(renderer, {
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
      content: isBatchMode ? `BATCH UPGRADE (${batchPackages.length} packages)` : "UPGRADE PACKAGE",
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

  if (isBatchMode) {
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: "SELECTED PACKAGES",
        attributes: TextAttributes.BOLD,
        fg: colors.yellow[200],
      })
    );
    pkgInfo.add(new TextRenderable(renderer, { content: "" }));
    
    for (const pkg of batchPackages.slice(0, 6)) {
      const outdated = batchOutdated.find(o => o.name === pkg.name);
      const arrow = outdated ? ` → ${outdated.latest}` : "";
      pkgInfo.add(
        new TextRenderable(renderer, {
          content: `• ${pkg.name}${arrow}`,
          fg: outdated ? colors.yellow[300] : colors.yellow[500],
        })
      );
    }
    if (batchPackages.length > 6) {
      pkgInfo.add(
        new TextRenderable(renderer, {
          content: `  ... +${batchPackages.length - 6} more`,
          fg: colors.yellow[500],
          attributes: TextAttributes.DIM,
        })
      );
    }
    pkgInfo.add(new TextRenderable(renderer, { content: "" }));
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: `${batchOutdated.length} outdated | ${batchPackages.length - batchOutdated.length} current`,
        fg: colors.yellow[400],
      })
    );
  } else {
    pkgInfo.add(
      new TextRenderable(renderer, {
        content: selectedDep?.name || "Unknown",
        attributes: TextAttributes.BOLD,
        fg: colors.yellow[200],
      })
    );
    pkgInfo.add(new TextRenderable(renderer, { content: "" }));

    if (metadata?.description) {
      const shortDesc = metadata.description.slice(0, 55);
      pkgInfo.add(
        new TextRenderable(renderer, {
          content: shortDesc,
          fg: colors.yellow[400],
          attributes: TextAttributes.DIM,
        })
      );
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
      pkgInfo.add(
        new TextRenderable(renderer, {
          content: `Update: ${outdatedInfo.type.toUpperCase()}`,
          attributes: TextAttributes.BOLD,
          fg: getUpdateTypeColor(outdatedInfo.type),
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
    const isBlocked = option.type === "latest" && state.safeMode;

    const optionRow = new BoxRenderable(renderer, { flexDirection: "row" });
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
        width: 12,
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
    if (isBlocked) {
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
        content: "Safe Mode: Latest blocked (Press S to toggle)",
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
      content: "Esc Close",
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
