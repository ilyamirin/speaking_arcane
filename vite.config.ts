import { defineConfig } from "vite";

function resolveBase(): string {
  const explicitBase = process.env.BASE_PATH;
  if (explicitBase) {
    return explicitBase.endsWith("/") ? explicitBase : `${explicitBase}/`;
  }

  if (!process.env.GITHUB_ACTIONS) {
    return "/";
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repositoryName || repositoryName.endsWith(".github.io")) {
    return "/";
  }

  return `/${repositoryName}/`;
}

export default defineConfig({
  base: resolveBase(),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"]
        }
      }
    }
  }
});
