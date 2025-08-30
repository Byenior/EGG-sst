// import type { Config } from "jest";
// const config: Config = {
//   preset: "ts-jest",
//   testEnvironment: "node",
//   clearMocks: true,
// };
// export default config;
import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/packages/functions"],
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json", useESM: true }],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["packages/functions/**/*.ts", "!packages/functions/**/__tests__/**"],
};
export default config;
