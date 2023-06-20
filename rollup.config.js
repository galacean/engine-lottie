const fs = require("fs");
const path = require("path");

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import glslify from "rollup-plugin-glslify";
import serve from "rollup-plugin-serve";
import miniProgramPlugin from "./rollup.miniprogram.plugin";
import replace from "@rollup/plugin-replace";
import { swc, defineRollupSwcOption } from "rollup-plugin-swc3";

const { BUILD_TYPE, NODE_ENV } = process.env;

const pkgs = [
  {
    location: __dirname,
    pkgJson: require(path.resolve(__dirname, "package.json"))
  }
];

// toGlobalName

const extensions = [".js", ".jsx", ".ts", ".tsx"];
const mainFields = NODE_ENV === "development" ? ["debug", "module", "main"] : undefined;

const commonPlugins = [
  resolve({ extensions, preferBuiltins: true, mainFields }),
  glslify({
    include: [/\.glsl$/]
  }),
  swc(
    defineRollupSwcOption({
      include: /\.[mc]?[jt]sx?$/,
      exclude: /node_modules/,
      jsc: {
        loose: true,
        externalHelpers: true,
        target: "es5"
      },
      sourceMaps: true
    })
  ),
  commonjs(),
  NODE_ENV === "development"
    ? serve({
        contentBase: "packages",
        port: 9999
      })
    : null
];

function config({ location, pkgJson }) {
  const input = path.join(location, "src", "index.ts");
  const dependencies = Object.assign(pkgJson.peerDependencies ?? {});
  const commonExternal = Object.keys(dependencies);
  commonPlugins.push(
    replace({
      preventAssignment: true,
      __buildVersion: pkgJson.version
    })
  );

  return {
    umd: () => {
      let file = path.join(location, "dist", "browser.js");
      const plugins = [...commonPlugins];
      return {
        input,
        external: commonExternal,
        output: [
          {
            file,
            name: "Galacean.Lottie",
            format: "umd",
            globals: {
              "@galacean/engine": "Galacean"
            }
          }
        ],
        plugins
      };
    },
    mini: () => {
      const external = commonExternal
        .concat("@galacean/engine-miniprogram-adapter")
        .map((name) => `${name}/dist/miniprogram`);
      const plugins = [...commonPlugins, ...miniProgramPlugin];
      return {
        input,
        output: [
          {
            format: "cjs",
            file: path.join(location, "dist/miniprogram.js"),
            sourcemap: false
          }
        ],
        external,
        plugins
      };
    },
    module: () => {
      const plugins = [...commonPlugins];
      return {
        input,
        external: commonExternal,
        output: [
          {
            file: path.join(location, pkgJson.module),
            format: "es",
            sourcemap: true
          },
          {
            file: path.join(location, pkgJson.main),
            sourcemap: true,
            format: "commonjs"
          }
        ],
        plugins
      };
    }
  };
}

async function makeRollupConfig({ type, compress = true, visualizer = true, ..._ }) {
  return config({ ..._ })[type](compress, visualizer);
}

let promises = [];

switch (BUILD_TYPE) {
  case "UMD":
    promises.push(...getUMD());
    break;
  case "MODULE":
    promises.push(...getModule());
    break;
  case "MINI":
    promises.push(...getMini());
    break;
  case "ALL":
    promises.push(...getAll());
    break;
  default:
    break;
}

function getUMD() {
  const configs = [...pkgs];
  return configs.map((config) => makeRollupConfig({ ...config, type: "umd" }));
}

function getModule() {
  const configs = [...pkgs];
  return configs.map((config) => makeRollupConfig({ ...config, type: "module" }));
}

function getMini() {
  const configs = [...pkgs];
  return configs.map((config) => makeRollupConfig({ ...config, type: "mini" }));
}

function getAll() {
  return [...getModule(), ...getMini(), ...getUMD()];
}

export default Promise.all(promises);
