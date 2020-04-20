import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "umd",
  },
  plugins: [
    typescript({
      noEmitOnError: false,
    }),
    resolve({ browser: true }),
  ],
};
