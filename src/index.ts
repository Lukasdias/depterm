import { renderDashboard, state, renderer } from "./ui/dashboard.js";
import { stopSpinner, stopAllSpinners } from "./ui/spinner.js";
import { detectPackageManager } from "./core/detect-manager.js";
import { readPackageJson, extractDependencies } from "./core/read-package.js";
import { getOutdatedPackages } from "./core/outdated.js";
import { checkConflicts } from "./core/conflicts.js";
import { fetchPackageMetadata } from "./core/package-info.js";
import { upgradePackage, getTargetVersion } from "./core/upgrade.js";

renderer.keyInput.on("keypress", (key) => {
  if (key.name === "f12") {
    renderer.console.toggle();
  }
});

async function loadData(): Promise<void> {
  state.isLoading = true;
  stopAllSpinners();
  renderDashboard();

  try {
    state.packageManager = await detectPackageManager();
    const packageJson = await readPackageJson();
    state.dependencies = extractDependencies(packageJson);
    state.outdated = await getOutdatedPackages(state.packageManager);
    state.conflicts = await checkConflicts(state.packageManager);
  } catch (err) {
    console.error("Error loading data:", err);
  } finally {
    state.isLoading = false;
    stopSpinner("header-loading", "✓ Ready");
    renderDashboard();
    loadSelectedPackageMetadata();
  }
}

async function loadSelectedPackageMetadata(): Promise<void> {
  const selectedDep = state.dependencies[state.selectedIndex];
  if (!selectedDep) return;

  state.metadataLoading.add(selectedDep.name);

  fetchPackageMetadata(selectedDep.name)
    .then((metadata) => {
      if (metadata) {
        state.packageMetadata.set(selectedDep.name, metadata);
      }
    })
    .finally(() => {
      state.metadataLoading.delete(selectedDep.name);
      renderDashboard();
    });
}

renderer.keyInput.on("keypress", async (key) => {
  const keyName = key.name || key.sequence;

  if (state.isLoading) {
    return;
  }

  if (keyName === "q") {
    stopAllSpinners();
    renderer.destroy();
    process.exit(0);
  }

  if (keyName === "escape") {
    if (state.actionDialog.isOpen) {
      state.actionDialog.isOpen = false;
      state.actionDialog.selectedIndex = 0;
      renderDashboard();
      return;
    }
  }

  if (state.actionDialog.isOpen) {
    const selectedDep = state.dependencies[state.selectedIndex];
    const outdatedInfo = state.outdated.find(
      (o) => o.name === selectedDep?.name,
    );

    const maxIndex = outdatedInfo ? 4 : 1;

    if (keyName === "up") {
      state.actionDialog.selectedIndex = Math.max(
        0,
        state.actionDialog.selectedIndex - 1,
      );
      renderDashboard();
    } else if (keyName === "down") {
      state.actionDialog.selectedIndex = Math.min(
        maxIndex,
        state.actionDialog.selectedIndex + 1,
      );
      renderDashboard();
    } else if (keyName === "1") {
      state.actionDialog.selectedIndex = 0;
      renderDashboard();
    } else if (keyName === "2") {
      state.actionDialog.selectedIndex = 1;
      renderDashboard();
    } else if (keyName === "3") {
      state.actionDialog.selectedIndex = 2;
      renderDashboard();
    } else if (keyName === "4") {
      state.actionDialog.selectedIndex = 3;
      renderDashboard();
    } else if (keyName === "d") {
      state.actionDialog.selectedIndex = maxIndex;
      renderDashboard();
    } else if (keyName === "s") {
      state.safeMode = !state.safeMode;
      renderDashboard();
    } else if (keyName === "enter" || keyName === "return") {
      const idx = state.actionDialog.selectedIndex;
      
      if (!outdatedInfo || idx === 4) {
        const target = outdatedInfo?.latest || selectedDep?.currentVersion || "latest";
        const result = await upgradePackage(
          state.packageManager,
          {
            name: selectedDep.name,
            current: selectedDep.currentVersion,
            type: "latest",
            target,
          },
          { safeMode: state.safeMode, dryRun: true },
          state.projectPath,
        );
        console.log(result.message);
        if (result.output) console.log(result.output);
        state.actionDialog.isOpen = false;
        renderDashboard();
        return;
      }

      const types: ("patch" | "minor" | "major" | "latest")[] = ["patch", "minor", "major", "latest"];
      const actionType = types[idx];

      if (actionType === "major" && state.safeMode) {
        return;
      }

      const target = getTargetVersion(
        selectedDep.currentVersion,
        outdatedInfo.wanted,
        outdatedInfo.latest,
        actionType,
      );

      state.actionDialog.isUpgrading = true;
      renderDashboard();

      const result = await upgradePackage(
        state.packageManager,
        {
          name: selectedDep.name,
          current: selectedDep.currentVersion,
          type: actionType,
          target,
        },
        { safeMode: state.safeMode, dryRun: false },
        state.projectPath,
      );

      console.log(result.message);
      if (result.output) console.log(result.output);

      if (result.success) {
        loadData();
      }

      state.actionDialog.isOpen = false;
      state.actionDialog.isUpgrading = false;
      renderDashboard();
    }
    return;
  }

  if (keyName === "up") {
    state.selectedIndex = Math.max(0, state.selectedIndex - 1);
    renderDashboard();
    loadSelectedPackageMetadata();
  } else if (keyName === "down") {
    state.selectedIndex = Math.min(
      state.dependencies.length - 1,
      state.selectedIndex + 1,
    );
    renderDashboard();
    loadSelectedPackageMetadata();
  } else if (keyName === "enter" || keyName === "return") {
    const selectedDep = state.dependencies[state.selectedIndex];
    if (selectedDep) {
      state.actionDialog.isOpen = true;
      state.actionDialog.selectedIndex = 0;
      renderDashboard();
    }
  } else if (keyName === "r") {
    loadData();
  } else if (keyName === "s") {
    state.safeMode = !state.safeMode;
    renderDashboard();
  }
});

await loadData();
