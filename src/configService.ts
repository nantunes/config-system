import { ConfigurationService } from "./utils/config";

const service = new ConfigurationService({ application: "test" });
service.add({
  contextId: import.meta.url,
  rules: [
    {
      select: {
        module: "./App.tsx",
      },
      apply: {
        testId: "A",
      },
    },
    {
      select: {
        module: "./App.tsx",
      },
      apply: {
        anArray: ["A"],
      },
    },
    {
      select: {
        module: "./App.tsx",
      },
      apply: {
        anArray: { $op: "add", value: ["B"] },
      },
    },
  ],
});

export default service;
