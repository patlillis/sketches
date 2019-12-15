import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "umd",
    globals: { p5: "p5" }
  },
  plugins: [typescript()],
  external: ["p5"]
};
