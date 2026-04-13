import "@fontsource/instrument-serif";
import "@fontsource/manrope";
import "./styles.css";
import { renderApp } from "./ui/App";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("App root #app was not found.");
}

renderApp(root);
