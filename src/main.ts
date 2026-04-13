import "@fontsource/instrument-serif";
import "@fontsource/manrope";
import "./styles.css";
import { renderApp, type PageContext } from "./ui/App";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("App root #app was not found.");
}

const pageMode = root.dataset.pageMode;
const spreadSlug = root.dataset.spreadSlug;

const pageContext: PageContext =
  pageMode === "spread-detail" && spreadSlug
    ? {
        mode: "spread-detail",
        spreadSlug
      }
    : {
        mode: "home"
      };

renderApp(root, pageContext);
