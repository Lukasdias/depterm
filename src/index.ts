import { renderDashboard, state, renderer } from "./ui/dashboard.js";
import { stopSpinner, stopAllSpinners } from "./ui/spinner.js";
import { detectPackageManager } from "./core/detect-manager.js";
import { readPackageJson, extractDependencies } from "./core/read-package.js";
import { getOutdatedPackages } from "./core/outdated.js";
import { checkConflicts } from "./core/conflicts.js";
import { fetchPackageMetadata } from "./core/package-info.js";
import { upgradePackage, getTargetVersion } from "./core/upgrade.js";

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

  if (keyName === "q" || keyName === "escape") {
    stopAllSpinners();
    renderer.destroy();
    process.exit(0);
  }

  if (keyName === "up") {
    state.selectedIndex = Math.max(0, state.selectedIndex - 1);
    renderDashboard();
    loadSelectedPackageMetadata();
  } else if (keyName === "down") {
    state.selectedIndex = Math.min(state.dependencies.length - 1, state.selectedIndex + 1);
    renderDashboard();
    loadSelectedPackageMetadata();
  } else if (keyName === "tab") {
    state.focusMode = state.focusMode === "list" ? "action" : "list";
    renderDashboard();
  } else if (keyName === "r") {
    loadData();
  } else if (keyName === "s") {
    state.safeMode = !state.safeMode;
    renderDashboard();
  } else if (state.focusMode === "action") {
    const selectedDep = state.dependencies[state.selectedIndex];
    const outdatedInfo = state.outdated.find((o) => o.name === selectedDep?.name);

    if (!selectedDep || !outdatedInfo) {
      return;
    }

    let actionType: "patch" | "minor" | "major" | "latest" | null = null;

    if (keyName === "p") actionType = "patch";
    else if (keyName === "m") actionType = "minor";
    else if (keyName === "j") actionType = "major";
    else if (keyName === "l") actionType = "latest";
    else if (keyName === "d") actionType = "latest";

    if (actionType) {
      const target = getTargetVersion(
        selectedDep.currentVersion,
        outdatedInfo.wanted,
        outdatedInfo.latest,
        actionType
      );

      const dryRun = keyName === "d";

      const result = await upgradePackage(
        state.packageManager,
        { name: selectedDep.name, current: selectedDep.currentVersion, type: actionType, target },
        { safeMode: state.safeMode, dryRun },
        state.projectPath
      );

      console.log(result.message);
      if (result.output) {
        console.log(result.output);
      }

      if (result.success && !dryRun) {
        loadData();
      }
    }
  }
});

await loadData();
