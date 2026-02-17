import { renderDashboard, state, renderer } from "./ui/dashboard.js";
import { stopSpinner, stopAllSpinners } from "./ui/spinner.js";
import { detectPackageManager } from "./core/detect-manager.js";
import { readPackageJson, extractDependencies } from "./core/read-package.js";
import { getOutdatedPackages } from "./core/outdated.js";
import { checkConflicts } from "./core/conflicts.js";
import { fetchPackageMetadata } from "./core/package-info.js";
import { upgradePackage } from "./core/upgrade.js";

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
    const isBatchMode = state.selectedPackages.size > 0;
    const maxIndex = 2;

    if (keyName === "up") {
      state.actionDialog.selectedIndex = Math.max(0, state.actionDialog.selectedIndex - 1);
      renderDashboard();
    } else if (keyName === "down") {
      state.actionDialog.selectedIndex = Math.min(maxIndex, state.actionDialog.selectedIndex + 1);
      renderDashboard();
    } else if (keyName === "w") {
      state.actionDialog.selectedIndex = 0;
      renderDashboard();
    } else if (keyName === "l") {
      state.actionDialog.selectedIndex = 1;
      renderDashboard();
    } else if (keyName === "d") {
      state.actionDialog.selectedIndex = 2;
      renderDashboard();
    } else if (keyName === "s") {
      state.safeMode = !state.safeMode;
      renderDashboard();
    } else if (keyName === "enter" || keyName === "return") {
      const idx = state.actionDialog.selectedIndex;
      const isLatest = idx === 1;
      const isDryRun = idx === 2;

      if (isLatest && state.safeMode) {
        return;
      }

      state.actionDialog.isUpgrading = true;
      renderDashboard();

      let success = true;
      
      if (isBatchMode) {
        const batchPackages = state.dependencies.filter(d => state.selectedPackages.has(d.name));
        const batchOutdated = state.outdated.filter(o => state.selectedPackages.has(o.name));

        for (const pkg of batchPackages) {
          const outdated = batchOutdated.find(o => o.name === pkg.name);
          if (!outdated && !isDryRun) continue;

          const target = isLatest ? outdated?.latest : outdated?.wanted || pkg.currentVersion;
          const result = await upgradePackage(
            state.packageManager,
            {
              name: pkg.name,
              current: pkg.currentVersion,
              type: isLatest ? "latest" : "wanted",
              target: target || "latest",
            },
            { safeMode: state.safeMode, dryRun: isDryRun },
            state.projectPath,
          );
          if (!result.success) success = false;
        }
      } else {
        const target = outdatedInfo?.latest || selectedDep?.currentVersion || "latest";
        const result = await upgradePackage(
          state.packageManager,
          {
            name: selectedDep.name,
            current: selectedDep.currentVersion,
            type: isLatest ? "latest" : "wanted",
            target: isLatest ? outdatedInfo!.latest : outdatedInfo?.wanted || target,
          },
          { safeMode: state.safeMode, dryRun: isDryRun },
          state.projectPath,
        );
        success = result.success;
      }

      state.actionDialog.isUpgrading = false;
      state.actionDialog.isOpen = false;
      state.actionDialog.selectedIndex = 0;
      state.selectedPackages.clear();

      if (success && !isDryRun) {
        loadData();
      } else {
        renderDashboard();
      }
    }
    return;
  }

  if (state.filter.isActive) {
    if (keyName === "escape") {
      state.filter.isActive = false;
      state.filter.query = "";
      state.selectedIndex = 0;
      renderDashboard();
      return;
    }
    
    if (keyName === "enter" || keyName === "return") {
      state.filter.isActive = false;
      renderDashboard();
      return;
    }
    
    if (keyName === "backspace") {
      state.filter.query = state.filter.query.slice(0, -1);
      state.selectedIndex = 0;
      renderDashboard();
      return;
    }
    
    if (key.name && key.name.length === 1 && /[a-zA-Z0-9\-_]/.test(key.name)) {
      state.filter.query += key.name;
      state.selectedIndex = 0;
      renderDashboard();
      return;
    }
    
    if (keyName === "up") {
      state.selectedIndex = Math.max(0, state.selectedIndex - 1);
      renderDashboard();
    } else if (keyName === "down") {
      const filteredCount = state.dependencies.filter(d => 
        d.name.toLowerCase().includes(state.filter.query.toLowerCase())
      ).length;
      state.selectedIndex = Math.min(filteredCount - 1, state.selectedIndex + 1);
      renderDashboard();
    }
    return;
  }

  if (keyName === "/") {
    state.filter.isActive = true;
    state.filter.query = "";
    renderDashboard();
    return;
  }

  if (keyName === "up") {
    state.selectedIndex = Math.max(0, state.selectedIndex - 1);
    renderDashboard();
    loadSelectedPackageMetadata();
  } else if (keyName === "down") {
    const filteredDeps = state.filter.query
      ? state.dependencies.filter(d => 
          d.name.toLowerCase().includes(state.filter.query.toLowerCase())
        )
      : state.dependencies;
    state.selectedIndex = Math.min(
      filteredDeps.length - 1,
      state.selectedIndex + 1,
    );
    renderDashboard();
    loadSelectedPackageMetadata();
  } else if (keyName === "enter" || keyName === "return") {
    const filteredDeps = state.filter.query
      ? state.dependencies.filter(d => 
          d.name.toLowerCase().includes(state.filter.query.toLowerCase())
        )
      : state.dependencies;
    const selectedDep = filteredDeps[state.selectedIndex];
    if (selectedDep) {
      state.actionDialog.isOpen = true;
      state.actionDialog.selectedIndex = 0;
      state.filter.isActive = false;
      state.filter.query = "";
      renderDashboard();
    }
  } else if (keyName === "r") {
    loadData();
  } else if (keyName === "s") {
    state.safeMode = !state.safeMode;
    renderDashboard();
  } else if (keyName === "space" || keyName === " ") {
    const filteredDeps = state.filter.query
      ? state.dependencies.filter(d => 
          d.name.toLowerCase().includes(state.filter.query.toLowerCase())
        )
      : state.dependencies;
    const currentPkg = filteredDeps[state.selectedIndex];
    if (currentPkg) {
      if (state.selectedPackages.has(currentPkg.name)) {
        state.selectedPackages.delete(currentPkg.name);
      } else {
        state.selectedPackages.add(currentPkg.name);
      }
      renderDashboard();
    }
  } else if (keyName === "a") {
    const outdatedNames = state.outdated.map(o => o.name);
    for (const name of outdatedNames) {
      state.selectedPackages.add(name);
    }
    renderDashboard();
  } else if (keyName === "c") {
    state.selectedPackages.clear();
    renderDashboard();
  } else if (keyName === "b" && state.selectedPackages.size > 0) {
    state.actionDialog.isOpen = true;
    state.actionDialog.selectedIndex = 0;
    state.filter.isActive = false;
    state.filter.query = "";
    renderDashboard();
  }
});

await loadData();
