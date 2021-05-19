import dotenv from "dotenv";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";
import css from "rollup-plugin-css-only";

dotenv.config();

const isProd = process.env.BUILD === "production";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/
`;

const output = [
  {
    input: "./src/main.ts",
    output: {
      dir: "./dist",
      sourcemap: "inline",
      sourcemapExcludeSources: isProd,
      format: "cjs",
      exports: "default",
      banner,
    },
    external: ["obsidian"],
    plugins: [
      css({ output: "styles.css" }),
      typescript(),
      nodeResolve({ browser: true }),
      commonjs(),
      copy({
        targets: [{ src: "./manifest.json", dest: "./dist" }],
      }),
    ],
  },
];

if (process.env.PLUGIN_DEST) {
  output.push({
    input: "./src/main.ts",
    output: {
      dir: process.env.PLUGIN_DEST,
      sourcemap: "inline",
      sourcemapExcludeSources: isProd,
      format: "cjs",
      exports: "default",
      banner,
    },
    external: ["obsidian"],
    plugins: [
      css({ output: "styles.css" }),
      typescript(),
      nodeResolve({ browser: true }),
      commonjs(),
      copy({
        targets: [{ src: "./manifest.json", dest: process.env.PLUGIN_DEST }],
      }),
    ],
  });
}

export default output;
