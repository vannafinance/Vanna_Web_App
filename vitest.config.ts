import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "lib/utils/earn/calculations.ts",
        "lib/utils/earn/transactions.ts",
        "lib/utils/earn/earnMulticall.ts",
        "lib/utils/web3/**/*.ts",
        "lib/utils/prices/priceFeed.ts",
        "store/**/*.ts",
        "app/api/prices/route.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
