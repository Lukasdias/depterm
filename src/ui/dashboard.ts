import { BoxRenderable } from "@opentui/core";
import { renderer, state } from "./state.js";
import { createHeader } from "./components/header.js";
import { createLeftPanel } from "./components/left-panel.js";
import { createRightPanel } from "./components/right-panel.js";
import { createFooter } from "./components/footer.js";

let dashboardContainer: BoxRenderable | null = null;

export function renderDashboard(): void {
  if (dashboardContainer) {
    dashboardContainer.destroy();
  }

  dashboardContainer = new BoxRenderable(renderer, {
    id: "dashboard",
    flexDirection: "column",
    height: "100%",
    width: "100%",
  });

  dashboardContainer.add(createHeader());

  const contentArea = new BoxRenderable(renderer, {
    id: "content-area",
    flexDirection: "row",
    flexGrow: 1,
  });

  const leftPanelWrapper = new BoxRenderable(renderer, {
    id: "left-panel-wrapper",
    width: "45%",
    height: "100%",
  });
  leftPanelWrapper.add(createLeftPanel());
  contentArea.add(leftPanelWrapper);

  const rightPanelWrapper = new BoxRenderable(renderer, {
    id: "right-panel-wrapper",
    width: "55%",
    height: "100%",
  });
  rightPanelWrapper.add(createRightPanel());
  contentArea.add(rightPanelWrapper);

  dashboardContainer.add(contentArea);
  dashboardContainer.add(createFooter());

  renderer.root.add(dashboardContainer);
}

export { state, renderer } from "./state.js";
