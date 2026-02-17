import { BoxRenderable, TextRenderable, TextAttributes } from "@opentui/core";
import { renderer, state } from "../state.js";
import { colors, getUpdateTypeColor } from "../colors.js";
import { formatAuthor } from "../../core/package-info.js";

function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text];
  
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxWidth) {
      currentLine = currentLine ? currentLine + " " + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text.slice(0, maxWidth)];
}

export function createRightPanel(): BoxRenderable {
  const selectedDep = state.dependencies[state.selectedIndex];
  
  const panel = new BoxRenderable(renderer, {
    id: "right-panel",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    border: true,
    borderColor: colors.ui.border,
  });

  if (!selectedDep) {
    const emptyState = new BoxRenderable(renderer, {
      id: "right-panel-empty",
      flexDirection: "column",
      padding: 1,
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    });
    emptyState.add(
      new TextRenderable(renderer, {
        content: "No package selected",
        attributes: TextAttributes.DIM,
        fg: colors.yellow[400],
      })
    );
    panel.add(emptyState);
    return panel;
  }

  const outdatedInfo = state.outdated.find((o) => o.name === selectedDep.name);

  const overview = new BoxRenderable(renderer, {
    id: "right-panel-overview",
    flexDirection: "column",
    padding: 1,
    height: "40%",
  });

  overview.add(
    new TextRenderable(renderer, {
      content: "OVERVIEW",
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );
  overview.add(new TextRenderable(renderer, { content: "" }));
  overview.add(
    new TextRenderable(renderer, {
      content: selectedDep.name,
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );
  overview.add(new TextRenderable(renderer, { content: "" }));
  overview.add(
    new TextRenderable(renderer, {
      content: `Current: ${selectedDep.currentVersion}`,
      attributes: TextAttributes.DIM,
      fg: colors.yellow[400],
    })
  );
  
  if (outdatedInfo) {
    overview.add(
      new TextRenderable(renderer, {
        content: `Wanted: ${outdatedInfo.wanted}`,
        fg: colors.yellow[200],
      })
    );
    overview.add(
      new TextRenderable(renderer, {
        content: `Latest: ${outdatedInfo.latest}`,
        attributes: TextAttributes.BOLD,
        fg: colors.yellow[100],
      })
    );
  }

  overview.add(new TextRenderable(renderer, { content: "" }));
  overview.add(
    new TextRenderable(renderer, {
      content: `Type: ${selectedDep.type === "devDependency" ? "Dev Dependency" : "Dependency"}`,
      fg: colors.yellow[300],
    })
  );

  if (outdatedInfo) {
    overview.add(
      new TextRenderable(renderer, {
        content: `Upgrade: ${outdatedInfo.type.toUpperCase()}`,
        attributes: TextAttributes.BOLD,
        fg: getUpdateTypeColor(outdatedInfo.type),
      })
    );
  }

  panel.add(overview);

  const metadata = state.packageMetadata.get(selectedDep.name);
  const isLoadingMetadata = state.metadataLoading.has(selectedDep.name);

  const metadataSection = new BoxRenderable(renderer, {
    id: "right-panel-metadata",
    flexDirection: "column",
    padding: 1,
    flexGrow: 1,
    border: true,
    borderColor: colors.yellow[400],
  });

  metadataSection.add(
    new TextRenderable(renderer, {
      content: "PACKAGE INFO",
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );
  metadataSection.add(new TextRenderable(renderer, { content: "" }));

  if (isLoadingMetadata) {
    metadataSection.add(
      new TextRenderable(renderer, {
        content: "⏳ Loading package metadata...",
        fg: colors.yellow[300],
        attributes: TextAttributes.DIM,
      })
    );
  } else if (metadata) {
    if (metadata.description) {
      const descLines = wrapText(metadata.description, 50);
      for (const line of descLines) {
        metadataSection.add(
          new TextRenderable(renderer, {
            content: line,
            fg: colors.yellow[100],
          })
        );
      }
      metadataSection.add(new TextRenderable(renderer, { content: "" }));
    }

    const author = formatAuthor(metadata.author);
    if (author) {
      metadataSection.add(
        new TextRenderable(renderer, {
          content: `👤 ${author}`,
          fg: colors.yellow[300],
        })
      );
    }

    if (metadata.license) {
      metadataSection.add(
        new TextRenderable(renderer, {
          content: `📄 ${metadata.license}`,
          fg: colors.yellow[300],
        })
      );
    }

    if (metadata.homepage) {
      const homepage = metadata.homepage.replace(/^https?:\/\//, "").slice(0, 40);
      metadataSection.add(
        new TextRenderable(renderer, {
          content: `🔗 ${homepage}${metadata.homepage.length > 40 ? "..." : ""}`,
          fg: colors.yellow[300],
          attributes: TextAttributes.DIM,
        })
      );
    }
  } else {
    metadataSection.add(
      new TextRenderable(renderer, {
        content: "ℹ️ No metadata available",
        fg: colors.yellow[400],
        attributes: TextAttributes.DIM,
      })
    );
  }

  panel.add(metadataSection);

  const packageConflicts = state.conflicts.filter(
    (c) => c.package === selectedDep.name || c.package.includes(selectedDep.name)
  );

  const conflictsSection = new BoxRenderable(renderer, {
    id: "right-panel-conflicts",
    flexDirection: "column",
    padding: 1,
    height: "25%",
    border: true,
    borderColor: colors.yellow[300],
  });

  conflictsSection.add(
    new TextRenderable(renderer, {
      content: "CONFLICTS",
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );

  if (packageConflicts.length > 0) {
    for (const c of packageConflicts) {
      const conflictRow = new BoxRenderable(renderer, {
        flexDirection: "row",
      });
      const conflictPkg = new BoxRenderable(renderer, { width: "40%" });
      conflictPkg.add(
        new TextRenderable(renderer, {
          content: c.package,
          fg: c.severity === "error" ? colors.status.error : colors.yellow[200],
        })
      );
      conflictRow.add(conflictPkg);
      
      const conflictReason = new BoxRenderable(renderer, { flexGrow: 1 });
      conflictReason.add(
        new TextRenderable(renderer, {
          content: c.reason,
          attributes: TextAttributes.DIM,
          fg: colors.yellow[400],
        })
      );
      conflictRow.add(conflictReason);
      
      conflictsSection.add(conflictRow);
    }
  } else {
    conflictsSection.add(
      new TextRenderable(renderer, {
        content: "✓ No conflicts for this package",
        fg: colors.yellow[100],
      })
    );
  }

  panel.add(conflictsSection);

  const actionsSection = new BoxRenderable(renderer, {
    id: "right-panel-actions",
    flexDirection: "column",
    padding: 1,
    flexGrow: 1,
  });

  actionsSection.add(
    new TextRenderable(renderer, {
      content: `ACTIONS ${state.focusMode === "action" ? "(Active)" : "(Tab to focus)"}`,
      attributes: TextAttributes.BOLD,
      fg: colors.yellow[200],
    })
  );
  actionsSection.add(new TextRenderable(renderer, { content: "" }));
  actionsSection.add(
    new TextRenderable(renderer, {
      content: "  [P] Patch       Bug fixes only",
      fg: colors.yellow[200],
    })
  );
  actionsSection.add(
    new TextRenderable(renderer, {
      content: "  [M] Minor       New features",
      fg: colors.yellow[200],
    })
  );

  const majorAction = new TextRenderable(renderer, {
    content: outdatedInfo?.type === "major" && state.safeMode
      ? "  [J] Major       Breaking changes [BLOCKED]"
      : "  [J] Major       Breaking changes",
    fg: outdatedInfo?.type === "major" && state.safeMode ? colors.yellow[500] : colors.status.major,
    attributes: outdatedInfo?.type === "major" && state.safeMode ? TextAttributes.DIM : TextAttributes.NONE,
  });
  actionsSection.add(majorAction);

  actionsSection.add(
    new TextRenderable(renderer, {
      content: "  [L] Latest      Latest available",
      fg: colors.yellow[100],
    })
  );
  actionsSection.add(
    new TextRenderable(renderer, {
      content: "  [D] Dry Run     Preview changes",
      fg: colors.yellow[300],
    })
  );

  if (state.safeMode && outdatedInfo?.type === "major") {
    actionsSection.add(new TextRenderable(renderer, { content: "" }));
    actionsSection.add(
      new TextRenderable(renderer, {
        content: "Safe Mode: Major upgrades blocked",
        fg: colors.yellow[200],
        attributes: TextAttributes.DIM,
      })
    );
  }

  panel.add(actionsSection);

  return panel;
}
