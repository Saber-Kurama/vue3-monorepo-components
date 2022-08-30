import { resolve } from "path";
import {
  readFileSync,
  existsSync,
  readdirSync,
  lstatSync,
  rmdirSync,
  unlinkSync,
} from "fs";
import { defineConfig } from "vite";
import type { LogLevel, Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import dts from "vite-plugin-dts";

interface Manifest {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  version?: string;
}

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf-8")
) as Manifest;

const externalPkgs = ["@vue", "vue"].concat(
  Object.keys(pkg.dependencies || {}),
  Object.keys(pkg.peerDependencies || {})
);
const external = (id: string) =>
  externalPkgs.some((p) => p === id || id.startsWith(`${p}/`));
const logLevel = process.env.LOG_LEVEL;

export default defineConfig(async () => {
  return {
    logLevel: (logLevel || "info") as LogLevel,
    entry: "src/index.ts",
    mode: "production",
    build: {
      target: "modules",
      outDir: "dist",
      emptyOutDir: false,
      minify: false,
      brotliSize: false,
      rollupOptions: {
        input: ["src/index.ts"],
        external,
        // output: [
        //   {
        //     format: "es",
        //     dir: "es",
        //     entryFileNames: "[name].js",
        //     preserveModules: true,
        //     preserveModulesRoot: "components",
        //   },
        //   {
        //     format: "commonjs",
        //     dir: "lib",
        //     entryFileNames: "[name].js",
        //     preserveModules: true,
        //     preserveModulesRoot: "components",
        //   },
        // ],
      },
      // 开启lib模式，但不使用下面配置
      lib: {
        entry: "src/index.ts",
        formats: ["es", "cjs"],
      },
      commonjsOptions: {
        sourceMap: false,
      },
      chunkSizeWarningLimit: 10000,
    },
    plugins: [
      vue(),
      vueJsx(),
      dts({
        exclude: ["node_modules"],
        outputDir: ["dist"],
        // compilerOptions: { sourceMap },
        copyDtsFiles: false,
      }),
    ],
  };
});
