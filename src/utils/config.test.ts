import { vi, describe, it, beforeAll, beforeEach, expect } from "vitest";

import { ConfigurationService } from "./config";
import { IRule } from "./types";

describe("pentaho._core.config.Service", () => {
  // TODO: Should we refactor the tests so they don't depend on the "private" property __ruleStore?

  describe("adding", () => {
    describe("select.module", () => {
      let ruleNoId: IRule;
      let ruleOneId1: IRule;
      let ruleOneId2: IRule;
      let ruleMultiIds: IRule;

      let configurationService: ConfigurationService;

      beforeAll(() => {
        ruleNoId = {
          select: { user: "1", theme: "1", locale: "1", application: "1" },
        };

        ruleOneId1 = {
          select: {
            module: "A",
            user: "1",
            theme: "1",
            locale: "1",
            application: "1",
          },
        };
        ruleOneId2 = {
          select: {
            module: "B",
            user: "1",
            theme: "1",
            locale: "1",
            application: "1",
          },
        };

        ruleMultiIds = {
          select: {
            module: ["test/type", "test/type2", "A2"],
            user: "1",
            theme: "1",
            locale: "1",
            application: "1",
          },
        };
      });

      beforeEach(() => {
        configurationService = new ConfigurationService({ application: "1" });
      });

      it("should define a rule that has one module id", () => {
        configurationService.add({ rules: [ruleOneId1] });
        expect(configurationService.__ruleStore["A"]).toBeDefined();
      });

      it("should define a rule that has multiple module ids", () => {
        configurationService.add({ rules: [ruleMultiIds] });

        expect(configurationService.__ruleStore["test/type"]).toBeDefined();
        expect(configurationService.__ruleStore["test/type2"]).toBeDefined();
        expect(configurationService.__ruleStore["A2"]).toBeDefined();
      });

      it("should define multiple rules given a rule-set with multiple rules", () => {
        configurationService.add({ rules: [ruleOneId1, ruleOneId2] });

        expect(configurationService.__ruleStore["A"]).toBeDefined();
        expect(configurationService.__ruleStore["B"]).toBeDefined();
      });
    });

    describe("order", () => {
      // Notice that __ruleStore stores rules in the order they should be merged
      // with the more specific having higher indexes

      describe("priority", () => {
        let ruleHighPriority1: { priority: number; select: { module: string } };
        let ruleLowPriority1: { priority: number; select: { module: string } };

        let testTypeRuleStore: unknown[];

        beforeEach(() => {
          ruleHighPriority1 = { priority: 50, select: { module: "test/type" } };
          ruleLowPriority1 = { priority: -50, select: { module: "test/type" } };

          const configurationService = new ConfigurationService();

          configurationService.add({
            rules: [ruleHighPriority1, ruleLowPriority1],
          });

          testTypeRuleStore = configurationService.__ruleStore["test/type"];
        });

        it("higher priority before", () => {
          expect(testTypeRuleStore[1]).toBe(ruleHighPriority1);
        });

        it("lower priority after", () => {
          expect(testTypeRuleStore[0]).toBe(ruleLowPriority1);
        });
      });

      describe("specificity", () => {
        let ruleNotSpecific1: { select: { module: string } };
        let ruleApplicationSpecific1: {
          select: { module: string; application: string };
        };
        let ruleLocaleSpecific1: { select: { module: string; locale: string } };
        let ruleThemeSpecific1: { select: { module: string; theme: string } };
        let ruleUserSpecific1: { select: { module: string; user: string } };
        let ruleVerySpecific1: {
          select: {
            module: string;
            user: string;
            theme: string;
            locale: string;
            application: string;
          };
        };

        let testTypeRuleStore: unknown[];

        beforeEach(() => {
          ruleNotSpecific1 = { select: { module: "test/type" } };
          ruleVerySpecific1 = {
            select: {
              module: "test/type",
              user: "1",
              theme: "1",
              locale: "1",
              application: "1",
            },
          };
          ruleUserSpecific1 = { select: { module: "test/type", user: "1" } };
          ruleThemeSpecific1 = { select: { module: "test/type", theme: "1" } };
          ruleLocaleSpecific1 = {
            select: { module: "test/type", locale: "1" },
          };
          ruleApplicationSpecific1 = {
            select: { module: "test/type", application: "1" },
          };

          const configurationService = new ConfigurationService();

          configurationService.add({
            rules: [
              ruleVerySpecific1,
              ruleApplicationSpecific1,
              ruleLocaleSpecific1,
              ruleThemeSpecific1,
              ruleUserSpecific1,
              ruleNotSpecific1,
            ],
          });

          testTypeRuleStore = configurationService.__ruleStore["test/type"];
        });

        it("more specific before", () => {
          expect(testTypeRuleStore[5]).toBe(ruleVerySpecific1);
        });

        it("user specific before others", () => {
          expect(testTypeRuleStore[4]).toBe(ruleUserSpecific1);
        });

        it("theme specific after user specific", () => {
          expect(testTypeRuleStore[3]).toBe(ruleThemeSpecific1);
        });

        it("locale specific after theme specific", () => {
          expect(testTypeRuleStore[2]).toBe(ruleLocaleSpecific1);
        });

        it("application specific after locale specific", () => {
          expect(testTypeRuleStore[1]).toBe(ruleApplicationSpecific1);
        });

        it("less specific after", () => {
          expect(testTypeRuleStore[0]).toBe(ruleNotSpecific1);
        });
      });

      describe("ordinality", () => {
        let ruleVerySpecific1: {
          select: {
            module: string;
            user: string;
            theme: string;
            locale: string;
            application: string;
          };
        };
        let ruleVerySpecific2: {
          select: {
            module: string;
            user: string;
            theme: string;
            locale: string;
            application: string;
          };
        };

        let testTypeRuleStore: unknown[];

        beforeEach(() => {
          ruleVerySpecific1 = {
            select: {
              module: "test/type",
              user: "1",
              theme: "1",
              locale: "1",
              application: "1",
            },
          };
          ruleVerySpecific2 = {
            select: {
              module: "test/type",
              user: "1",
              theme: "1",
              locale: "1",
              application: "1",
            },
          };

          const configurationService = new ConfigurationService();

          configurationService.add({
            rules: [ruleVerySpecific1, ruleVerySpecific2],
          });

          testTypeRuleStore = configurationService.__ruleStore["test/type"];
        });

        it("later before", () => {
          expect(testTypeRuleStore[1]).toBe(ruleVerySpecific2);
        });

        it("earlier after", () => {
          expect(testTypeRuleStore[0]).toBe(ruleVerySpecific1);
        });
      });
    });
  });

  describe("selecting", () => {
    describe("modules", () => {
      let configurationService: ConfigurationService;

      beforeEach(() => {
        configurationService = new ConfigurationService();

        configurationService.add({
          rules: [
            {
              select: {
                module: "A",
              },
              apply: {
                testId: "A",
              },
            },
            {
              select: {
                module: "B",
              },
              apply: {
                testId: "B",
              },
            },
          ],
        });
      });

      it("should return null if no rule applies to module", async () => {
        const result = await configurationService.selectAsync("C");
        expect(result).toBeNull();
      });

      it("should return config if rule applies to module", async () => {
        const result = await configurationService.selectAsync("A");
        expect(result?.testId).toEqual("A");
      });
    });

    describe("select.module resolution", () => {
      describe("relative mapping", () => {
        it("should return config if rule applies to module", async () => {
          const configurationService: ConfigurationService =
            new ConfigurationService();

          configurationService.add({
            contextId: "test/B",
            rules: [
              {
                select: {
                  module: "./A",
                },
                apply: {
                  testId: "A",
                },
              },
            ],
          });

          const result = await configurationService.selectAsync("test/A");
          expect(result).not.toBe(null);
          expect(result?.testId).toEqual("A");
        });

        it("should throw if module id is relative and contextId is not specified", () => {
          const configurationService: ConfigurationService =
            new ConfigurationService();

          expect(() => {
            configurationService.add({
              rules: [
                {
                  select: {
                    module: "../A",
                  },
                  apply: {
                    testId: "A",
                  },
                },
              ],
            });
          }).toThrow();
        });
      });
    });

    describe("select.application resolution", () => {
      describe("relative mapping", () => {
        it("should return config if rule applies to application", async () => {
          const configurationService: ConfigurationService =
            new ConfigurationService({
              application: "test/App",
            });

          configurationService.add({
            contextId: "test/B",
            rules: [
              {
                select: {
                  module: "test/A",
                  application: "./App",
                },
                apply: {
                  testId: "A",
                },
              },
            ],
          });

          const result = await configurationService.selectAsync("test/A");
          expect(result).not.toBe(null);
          expect(result?.testId).toEqual("A");
        });

        it("should throw if module id is relative and contextId is not specified", () => {
          const configurationService: ConfigurationService =
            new ConfigurationService({
              application: "test/App",
            });

          expect(() => {
            configurationService.add({
              rules: [
                {
                  select: {
                    module: "test/A",
                    application: "../App",
                  },
                  apply: {
                    testId: "A",
                  },
                },
              ],
            });
          }).toThrow();
        });
      });
    });

    describe("filtering", () => {
      const ruleSet = {
        rules: [
          {
            select: {
              module: "A",
              user: "1",
            },
            apply: {
              testId: "A1",
            },
          },
          {
            select: {
              module: "A",
              user: "2",
            },
            apply: {
              testId: "A2",
            },
          },
          {
            select: {
              module: "A",
              user: ["3", "4"],
            },
            apply: {
              testId: "A3",
            },
          },
          {
            select: {
              module: "A",
              user: ["4", "5"],
              theme: "white",
            },
            apply: {
              testId: "A4",
            },
          },
          {
            select: {
              module: "B",
            },
            apply: {
              testId: "B",
            },
          },
        ],
      };

      it("should return null if no select rule applies to criteria", async () => {
        const configurationService = new ConfigurationService({
          user: "-1",
          theme: "white",
        });
        configurationService.add(ruleSet);

        const result = await configurationService.selectAsync("A");
        expect(result).toBeNull();
      });

      it("should return config if single-value select rule applies to criteria", async () => {
        const configurationService = new ConfigurationService({
          user: "2",
          theme: "white",
        });
        configurationService.add(ruleSet);

        const result = await configurationService.selectAsync("A");
        expect(result).not.toBeNull();
      });

      it("should return config if multi-value select rule applies to criteria", async () => {
        const configurationService = new ConfigurationService({
          user: "3",
          theme: "white",
        });
        configurationService.add(ruleSet);

        const result = await configurationService.selectAsync("A");
        expect(result).not.toBeNull();
      });
    });

    describe("dependencies and factories", () => {
      it("should resolve all dependencies relative to contextId", async () => {
        const moduleB = {};
        const moduleC = {};

        vi.doMock("test/config/B", () => {
          return {
            default: moduleB,
          };
        });
        vi.doMock("test/config/C", () => {
          return {
            default: moduleC,
          };
        });

        const ruleConfigFactory = vi.fn(() => ({}));

        const ruleSet = {
          contextId: "test/config/D",
          rules: [
            {
              select: { module: "A" },
              deps: ["./B", "./C"],
              apply: ruleConfigFactory,
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        configurationService.add(ruleSet);

        await configurationService.selectAsync("A");
        expect(ruleConfigFactory).toHaveBeenCalledTimes(1);
        expect(ruleConfigFactory).toHaveBeenCalledWith(moduleB, moduleC);
      });

      it("should throw if there are relative dependencies and contextId is not specified", () => {
        const ruleSet = {
          rules: [
            {
              select: { module: "A" },
              deps: ["../B", "../C"],
              apply: {},
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        expect(() => {
          configurationService.add(ruleSet);
        }).toThrow();
      });

      it("should resolve all dependencies and pass their values to the function factory", async () => {
        const moduleB = {};
        const moduleC = {};

        vi.doMock("test/config/B", () => {
          return {
            default: moduleB,
          };
        });
        vi.doMock("test/config/C", () => {
          return {
            default: moduleC,
          };
        });

        const ruleConfigFactory = vi.fn(() => ({}));

        const ruleSet = {
          rules: [
            {
              select: { module: "A" },
              deps: ["test/config/B", "test/config/C"],
              apply: ruleConfigFactory,
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        configurationService.add(ruleSet);

        await configurationService.selectAsync("A");
        expect(ruleConfigFactory).toHaveBeenCalledTimes(1);
        expect(ruleConfigFactory).toHaveBeenCalledWith(moduleB, moduleC);
      });

      it(
        "should resolve all dependencies and pass their values to the function factory, " +
          "even when there are multiple functional rules",
        async () => {
          const moduleB = {};
          const moduleC = {};

          vi.doMock("test/config/B", () => {
            return {
              default: moduleB,
            };
          });
          vi.doMock("test/config/C", () => {
            return {
              default: moduleC,
            };
          });

          const ruleConfigFactory1 = vi.fn(() => ({}));
          const ruleConfigFactory2 = vi.fn(() => ({}));

          const ruleSet = {
            rules: [
              {
                select: { module: "A" },
                deps: ["test/config/B", "test/config/C"],
                apply: ruleConfigFactory1,
              },
              {
                select: { module: "A" },
                deps: ["test/config/C", "test/config/B"],
                apply: ruleConfigFactory2,
              },
            ],
          };

          const configurationService = new ConfigurationService({});

          configurationService.add(ruleSet);

          await configurationService.selectAsync("A");
          expect(ruleConfigFactory1).toHaveBeenCalledTimes(1);
          expect(ruleConfigFactory1).toHaveBeenCalledWith(moduleB, moduleC);
          expect(ruleConfigFactory2).toHaveBeenCalledTimes(1);
          expect(ruleConfigFactory2).toHaveBeenCalledWith(moduleC, moduleB);
        }
      );

      it("should accept a function factory even when there are no dependencies", async () => {
        const ruleConfigFactory = vi.fn(() => ({}));

        const ruleSet = {
          rules: [
            {
              select: { module: "A" },
              apply: ruleConfigFactory,
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        configurationService.add(ruleSet);

        await configurationService.selectAsync("A");
        expect(ruleConfigFactory).toHaveBeenCalledTimes(1);
        expect(ruleConfigFactory).toHaveBeenCalledWith();
      });

      it("should use the configuration returned by a function factory", async () => {
        const ruleConfigFactory = vi.fn(() => ({
          testConfig: "1",
        }));

        const ruleSet = {
          rules: [
            {
              select: { module: "A" },
              apply: ruleConfigFactory,
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        configurationService.add(ruleSet);

        const result = await configurationService.selectAsync("A");
        expect(result).toEqual(
          expect.objectContaining({
            testConfig: "1",
          })
        );
      });

      it("should ignore a null configuration returned by a function factory", async () => {
        const ruleConfigFactory = vi.fn(() => null);

        const ruleSet = {
          rules: [
            {
              select: { module: "A" },
              apply: ruleConfigFactory,
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        configurationService.add(ruleSet);

        const result = await configurationService.selectAsync("A");
        expect(result).toEqual({});
      });

      it("should ignore an undefined configuration returned by a function factory", async () => {
        const ruleConfigFactory = vi.fn(() => undefined);

        const ruleSet = {
          rules: [
            {
              select: { module: "A" },
              apply: ruleConfigFactory,
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        configurationService.add(ruleSet);

        const result = await configurationService.selectAsync("A");
        expect(result).toEqual({});
      });

      it("should accept mixed functional and object rules", async () => {
        const ruleConfigFactory2 = vi.fn(() => ({
          testConfig2: "2",
        }));

        const ruleSet = {
          rules: [
            {
              select: { module: "A" },
              apply: {
                testConfig1: "1",
              },
            },
            {
              select: { module: "A" },
              apply: ruleConfigFactory2,
            },
          ],
        };

        const configurationService = new ConfigurationService({});

        configurationService.add(ruleSet);

        const result = await configurationService.selectAsync("A");
        expect(result).toEqual(
          expect.objectContaining({
            testConfig1: "1",
            testConfig2: "2",
          })
        );
      });
    });

    describe("external configuration", () => {
      let configurationService: ConfigurationService;

      beforeEach(() => {
        function selectExternalConfigsAsync(moduleId: string) {
          if (moduleId === "C") {
            return Promise.resolve([
              {
                priority: -Infinity,
                config: {
                  testId: "C",
                },
              },
            ]);
          }

          if (moduleId === "A") {
            return Promise.resolve([
              {
                priority: -Infinity,
                config: {
                  testId: "A",
                },
              },
            ]);
          }

          if (moduleId === "test/DefaultExternalPriority") {
            return Promise.resolve([
              {
                config: {
                  testId: "External",
                },
              },
            ]);
          }

          if (moduleId === "test/GreaterExternalPriority") {
            return Promise.resolve([
              {
                priority: 1,
                config: {
                  testId: "External",
                },
              },
            ]);
          }

          if (moduleId === "test/OnlyExternalConfig") {
            return Promise.resolve([
              {
                config: {
                  testId: "External",
                },
              },
            ]);
          }

          return Promise.resolve(null);
        }

        configurationService = new ConfigurationService(
          null,
          selectExternalConfigsAsync
        );

        configurationService.add({
          rules: [
            {
              priority: -Infinity,
              select: {
                module: "A",
              },
              apply: {
                testId: "A",
              },
            },
            {
              priority: -Infinity,
              select: {
                module: "test/DefaultExternalPriority",
              },
              apply: {
                testId: "Internal",
              },
            },
            {
              priority: -Infinity,
              select: {
                module: "test/GreaterExternalPriority",
              },
              apply: {
                testId: "Internal",
              },
            },
          ],
        });
      });

      it("should include the external configuration by default", async () => {
        const result = await configurationService.selectAsync("C");
        expect(result?.testId).toEqual("C");
      });

      it("should give less priority by default to the external configuration", async () => {
        const result = await configurationService.selectAsync(
          "test/DefaultExternalPriority"
        );
        expect(result?.testId).toEqual("Internal");
      });

      it("should have greater priority than internal configuration if priority = 1", async () => {
        const result = await configurationService.selectAsync(
          "test/GreaterExternalPriority"
        );
        expect(result?.testId).toEqual("External");
      });

      it("should get the external configuration when there is no internal configuration", async () => {
        const result = await configurationService.selectAsync(
          "test/OnlyExternalConfig"
        );
        expect(result?.testId).toEqual("External");
      });
    });
  });

  // TODO: All/Part of these tests should be moved to pentaho/util/spec.
  describe("merging", () => {
    let configurationService: ConfigurationService;
    let baseRule: {
      select: { module: string };
      apply: {
        simpleValue: string;
        arraySimpleValue: string[];
        complexValue: { id: string; otherProp: string };
        arrayComplexValue: { id: string; otherProp: string }[];
      };
    };

    beforeEach(() => {
      baseRule = {
        select: {
          module: "test/type",
        },
        apply: {
          simpleValue: "S1",
          arraySimpleValue: ["AS1", "AS2"],
          complexValue: {
            id: "C1",
            otherProp: "OC1",
          },
          arrayComplexValue: [
            {
              id: "AC1",
              otherProp: "OAC1",
            },
            {
              id: "AC2",
              otherProp: "OAC2",
            },
          ],
        },
      };

      configurationService = new ConfigurationService();

      configurationService.add({ rules: [baseRule] });
    });

    describe("default merge handlers", () => {
      let otherRule: {
        select: { module: string };
        apply: {
          simpleValue: string;
          arraySimpleValue: string[];
          complexValue: { id: string };
          arrayComplexValue: { id: string }[];
        };
      };

      let config: any;

      beforeEach(async () => {
        otherRule = {
          select: {
            module: "test/type",
          },
          apply: {
            simpleValue: "ALT_S1",
            arraySimpleValue: ["ALT_AS1"],
            complexValue: {
              id: "ALT_C1",
            },
            arrayComplexValue: [
              {
                id: "ALT_AC1",
              },
            ],
          },
        };

        configurationService.add({ rules: [otherRule] });

        const result = await configurationService.selectAsync("test/type");
        config = result;
      });

      it("should replace the value of the simple value property", () => {
        expect(config.simpleValue).toBe("ALT_S1");
      });

      it("should replace the value of the array of simple values property", () => {
        expect(config.arraySimpleValue.length).toBe(1);
        expect(config.arraySimpleValue[0]).toBe("ALT_AS1");
      });

      it("should merge the value of the complex value property", () => {
        expect(config.complexValue.id).toBe("ALT_C1");
        expect(config.complexValue.otherProp).toBe("OC1");
      });

      it("should replace the value of the array of complex values property", () => {
        expect(config.arrayComplexValue.length).toBe(1);
        expect(config.arrayComplexValue[0].id).toBe("ALT_AC1");
        expect(config.arrayComplexValue[0].otherProp).toBeUndefined();
      });
    });

    describe("replace merge handler", () => {
      let otherRule: {
        select: { module: string };
        apply: {
          simpleValue: { $op: string; value: string };
          arraySimpleValue: { $op: string; value: string[] };
          complexValue: { $op: string; value: { id: string } };
          arrayComplexValue: { $op: string; value: { id: string }[] };
        };
      };

      let config: any;

      beforeEach(async () => {
        otherRule = {
          select: {
            module: "test/type",
          },
          apply: {
            simpleValue: {
              $op: "replace",
              value: "ALT_S1",
            },
            arraySimpleValue: {
              $op: "replace",
              value: ["ALT_AS1"],
            },
            complexValue: {
              $op: "replace",
              value: {
                id: "ALT_C1",
              },
            },
            arrayComplexValue: {
              $op: "replace",
              value: [
                {
                  id: "ALT_AC1",
                },
              ],
            },
          },
        };

        configurationService.add({ rules: [otherRule] });

        const result = await configurationService.selectAsync("test/type");
        config = result;
      });

      it("should replace the value of the simple value property", () => {
        expect(config.simpleValue).toBe("ALT_S1");
      });

      it("should replace the value of the array of simple values property", () => {
        expect(config.arraySimpleValue.length).toBe(1);
        expect(config.arraySimpleValue[0]).toBe("ALT_AS1");
      });

      it("should replace the value of the complex value property", () => {
        expect(config.complexValue.id).toBe("ALT_C1");
        expect(config.complexValue.otherProp).toBeUndefined();
      });

      it("should replace the value of the array of complex values property", () => {
        expect(config.arrayComplexValue.length).toBe(1);
        expect(config.arrayComplexValue[0].id).toBe("ALT_AC1");
        expect(config.arrayComplexValue[0].otherProp).toBeUndefined();
      });
    });

    describe("merge merge handler", () => {
      let otherRule: {
        select: { module: string };
        apply: {
          simpleValue: { $op: string; value: string };
          arraySimpleValue: { $op: string; value: string[] };
          complexValue: { $op: string; value: { id: string } };
          arrayComplexValue: { $op: string; value: { id: string }[] };
        };
      };

      let config: any;

      beforeEach(async () => {
        otherRule = {
          select: {
            module: "test/type",
          },
          apply: {
            simpleValue: {
              $op: "merge",
              value: "ALT_S1",
            },
            arraySimpleValue: {
              $op: "merge",
              value: ["ALT_AS1"],
            },
            complexValue: {
              $op: "merge",
              value: {
                id: "ALT_C1",
              },
            },
            arrayComplexValue: {
              $op: "merge",
              value: [
                {
                  id: "ALT_AC1",
                },
              ],
            },
          },
        };

        configurationService.add({ rules: [otherRule] });

        const result = await configurationService.selectAsync("test/type");
        config = result;
      });

      it("should replace the value of the simple value property", () => {
        expect(config.simpleValue).toBe("ALT_S1");
      });

      it("should replace the value of the array of simple values property", () => {
        expect(config.arraySimpleValue.length).toBe(1);
        expect(config.arraySimpleValue[0]).toBe("ALT_AS1");
      });

      it("should merge the value of the complex value property", () => {
        expect(config.complexValue.id).toBe("ALT_C1");
        expect(config.complexValue.otherProp).toBe("OC1");
      });

      it("should replace the value of the array of complex values property", () => {
        expect(config.arrayComplexValue.length).toBe(1);
        expect(config.arrayComplexValue[0].id).toBe("ALT_AC1");
        expect(config.arrayComplexValue[0].otherProp).toBeUndefined();
      });
    });

    describe("add merge handler", () => {
      let otherRule: {
        select: { module: string };
        apply: {
          simpleValue: { $op: string; value: string };
          arraySimpleValue: { $op: string; value: string[] };
          complexValue: { $op: string; value: { id: string } };
          arrayComplexValue: { $op: string; value: { id: string }[] };
        };
      };

      let config: any;

      beforeEach(async () => {
        otherRule = {
          select: {
            module: "test/type",
          },
          apply: {
            simpleValue: {
              $op: "add",
              value: "ALT_S1",
            },
            arraySimpleValue: {
              $op: "add",
              value: ["ALT_AS1"],
            },
            complexValue: {
              $op: "add",
              value: {
                id: "ALT_C1",
              },
            },
            arrayComplexValue: {
              $op: "add",
              value: [
                {
                  id: "ALT_AC1",
                },
              ],
            },
          },
        };

        configurationService.add({ rules: [otherRule] });

        const result = await configurationService.selectAsync("test/type");
        config = result;
      });

      it("should replace the value of the simple value property", () => {
        expect(config.simpleValue).toBe("ALT_S1");
      });

      it("should append values to the array of simple values property", () => {
        expect(config.arraySimpleValue.length).toBe(3);

        expect(config.arraySimpleValue[0]).toBe("AS1");
        expect(config.arraySimpleValue[1]).toBe("AS2");
        expect(config.arraySimpleValue[2]).toBe("ALT_AS1");
      });

      it("should replace the value of the complex value property", () => {
        expect(config.complexValue.id).toBe("ALT_C1");
        expect(config.complexValue.otherProp).toBeUndefined();
      });

      it("should append values to the array of complex values property", () => {
        expect(config.arrayComplexValue.length).toBe(3);

        expect(config.arrayComplexValue[0].id).toBe("AC1");
        expect(config.arrayComplexValue[0].otherProp).toBe("OAC1");

        expect(config.arrayComplexValue[1].id).toBe("AC2");
        expect(config.arrayComplexValue[1].otherProp).toBe("OAC2");

        expect(config.arrayComplexValue[2].id).toBe("ALT_AC1");
        expect(config.arrayComplexValue[2].otherProp).toBeUndefined();
      });
    });

    describe("invalid merge handler", () => {
      let otherRule: {
        select: { module: string };
        apply: { simpleValue: { $op: string; value: string } };
      };

      beforeEach(() => {
        otherRule = {
          select: {
            module: "test/type",
          },
          apply: {
            simpleValue: {
              $op: "INVALID",
              value: "ALT_S1",
            },
          },
        };

        configurationService.add({ rules: [otherRule] });
      });

      it("should throw when merge operation is invalid", () => {
        return configurationService.selectAsync("test/type").then(
          () => {
            throw new Error("Expected to be rejected");
          },
          (error: Error) => {
            expect(error.name).toEqual("OperationInvalidError");
          }
        );
      });
    });

    describe("handling inconsistent types", () => {
      describe("default merge handlers", () => {
        describe("with simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              arraySimpleValue: string;
              complexValue: string;
              arrayComplexValue: string;
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                arraySimpleValue: "ALT_AS1",
                complexValue: "ALT_C1",
                arrayComplexValue: "ALT_AC1",
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue).toBe("ALT_C1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue).toBe("ALT_AC1");
          });
        });

        describe("with array of simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: string[];
              complexValue: string[];
              arrayComplexValue: string[];
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: ["ALT_S1"],
                complexValue: ["ALT_C1"],
                arrayComplexValue: ["ALT_AC1"],
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0]).toBe("ALT_S1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0]).toBe("ALT_C1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue[0]).toBe("ALT_AC1");
          });
        });

        describe("with complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { id: string };
              arraySimpleValue: { id: string };
              arrayComplexValue: { id: string };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: { id: "ALT_S1" },
                arraySimpleValue: { id: "ALT_AS1" },
                arrayComplexValue: { id: "ALT_AC1" },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue.id).toBe("ALT_S1");
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue.id).toBe("ALT_AS1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue.id).toBe("ALT_AC1");
          });
        });

        describe("with array of complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { id: string }[];
              arraySimpleValue: { id: string }[];
              complexValue: { id: string }[];
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: [{ id: "ALT_S1" }],
                arraySimpleValue: [{ id: "ALT_AS1" }],
                complexValue: [{ id: "ALT_C1" }],
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0].id).toBe("ALT_S1");
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue[0].id).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0].id).toBe("ALT_C1");
          });
        });
      });

      describe("replace merge handler", () => {
        describe("with simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              arraySimpleValue: { $op: string; value: string };
              complexValue: { $op: string; value: string };
              arrayComplexValue: { $op: string; value: string };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                arraySimpleValue: {
                  $op: "replace",
                  value: "ALT_AS1",
                },
                complexValue: {
                  $op: "replace",
                  value: "ALT_C1",
                },
                arrayComplexValue: {
                  $op: "replace",
                  value: "ALT_AC1",
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue).toBe("ALT_C1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue).toBe("ALT_AC1");
          });
        });

        describe("with array of simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: string[] };
              complexValue: { $op: string; value: string[] };
              arrayComplexValue: { $op: string; value: string[] };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "replace",
                  value: ["ALT_S1"],
                },
                complexValue: {
                  $op: "replace",
                  value: ["ALT_C1"],
                },
                arrayComplexValue: {
                  $op: "replace",
                  value: ["ALT_AC1"],
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0]).toBe("ALT_S1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0]).toBe("ALT_C1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue[0]).toBe("ALT_AC1");
          });
        });

        describe("with complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: { id: string } };
              arraySimpleValue: { $op: string; value: { id: string } };
              arrayComplexValue: { $op: string; value: { id: string } };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "replace",
                  value: { id: "ALT_S1" },
                },
                arraySimpleValue: {
                  $op: "replace",
                  value: { id: "ALT_AS1" },
                },
                arrayComplexValue: {
                  $op: "replace",
                  value: { id: "ALT_AC1" },
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue.id).toBe("ALT_S1");
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue.id).toBe("ALT_AS1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue.id).toBe("ALT_AC1");
          });
        });

        describe("with array of complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: { id: string }[] };
              arraySimpleValue: { $op: string; value: { id: string }[] };
              complexValue: { $op: string; value: { id: string }[] };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "replace",
                  value: [{ id: "ALT_S1" }],
                },
                arraySimpleValue: {
                  $op: "replace",
                  value: [{ id: "ALT_AS1" }],
                },
                complexValue: {
                  $op: "replace",
                  value: [{ id: "ALT_C1" }],
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0].id).toBe("ALT_S1");
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue[0].id).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0].id).toBe("ALT_C1");
          });
        });
      });

      describe("merge merge handler", () => {
        describe("with simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              arraySimpleValue: { $op: string; value: string };
              complexValue: { $op: string; value: string };
              arrayComplexValue: { $op: string; value: string };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                arraySimpleValue: {
                  $op: "merge",
                  value: "ALT_AS1",
                },
                complexValue: {
                  $op: "merge",
                  value: "ALT_C1",
                },
                arrayComplexValue: {
                  $op: "merge",
                  value: "ALT_AC1",
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue).toBe("ALT_C1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue).toBe("ALT_AC1");
          });
        });

        describe("with array of simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: string[] };
              complexValue: { $op: string; value: string[] };
              arrayComplexValue: { $op: string; value: string[] };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "merge",
                  value: ["ALT_S1"],
                },
                complexValue: {
                  $op: "merge",
                  value: ["ALT_C1"],
                },
                arrayComplexValue: {
                  $op: "merge",
                  value: ["ALT_AC1"],
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0]).toBe("ALT_S1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0]).toBe("ALT_C1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue[0]).toBe("ALT_AC1");
          });
        });

        describe("with complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: { id: string } };
              arraySimpleValue: { $op: string; value: { id: string } };
              arrayComplexValue: { $op: string; value: { id: string } };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "merge",
                  value: { id: "ALT_S1" },
                },
                arraySimpleValue: {
                  $op: "merge",
                  value: { id: "ALT_AS1" },
                },
                arrayComplexValue: {
                  $op: "merge",
                  value: { id: "ALT_AC1" },
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue.id).toBe("ALT_S1");
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue.id).toBe("ALT_AS1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue.id).toBe("ALT_AC1");
          });
        });

        describe("with array of complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: { id: string }[] };
              arraySimpleValue: { $op: string; value: { id: string }[] };
              complexValue: { $op: string; value: { id: string }[] };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "merge",
                  value: [{ id: "ALT_S1" }],
                },
                arraySimpleValue: {
                  $op: "merge",
                  value: [{ id: "ALT_AS1" }],
                },
                complexValue: {
                  $op: "merge",
                  value: [{ id: "ALT_C1" }],
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0].id).toBe("ALT_S1");
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue[0].id).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0].id).toBe("ALT_C1");
          });
        });
      });

      describe("add merge handler", () => {
        describe("with simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              arraySimpleValue: { $op: string; value: string };
              complexValue: { $op: string; value: string };
              arrayComplexValue: { $op: string; value: string };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                arraySimpleValue: {
                  $op: "add",
                  value: "ALT_AS1",
                },
                complexValue: {
                  $op: "add",
                  value: "ALT_C1",
                },
                arrayComplexValue: {
                  $op: "add",
                  value: "ALT_AC1",
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue).toBe("ALT_C1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue).toBe("ALT_AC1");
          });
        });

        describe("with array of simple", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: string[] };
              complexValue: { $op: string; value: string[] };
              arrayComplexValue: { $op: string; value: string[] };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "add",
                  value: ["ALT_S1"],
                },
                complexValue: {
                  $op: "add",
                  value: ["ALT_C1"],
                },
                arrayComplexValue: {
                  $op: "add",
                  value: ["ALT_AC1"],
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0]).toBe("ALT_S1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0]).toBe("ALT_C1");
          });

          it("should append values to the array of complex values property", () => {
            expect(config.arrayComplexValue.length).toBe(3);

            expect(config.arrayComplexValue[0].id).toBe("AC1");
            expect(config.arrayComplexValue[0].otherProp).toBe("OAC1");

            expect(config.arrayComplexValue[1].id).toBe("AC2");
            expect(config.arrayComplexValue[1].otherProp).toBe("OAC2");

            expect(typeof config.arrayComplexValue[2]).not.toBe("object");
            expect(config.arrayComplexValue[2]).toBe("ALT_AC1");
          });
        });

        describe("with complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: { id: string } };
              arraySimpleValue: { $op: string; value: { id: string } };
              arrayComplexValue: { $op: string; value: { id: string } };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "add",
                  value: { id: "ALT_S1" },
                },
                arraySimpleValue: {
                  $op: "add",
                  value: { id: "ALT_AS1" },
                },
                arrayComplexValue: {
                  $op: "add",
                  value: { id: "ALT_AC1" },
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue.id).toBe("ALT_S1");
          });

          it("should replace the value of the array of simple values property", () => {
            expect(config.arraySimpleValue.id).toBe("ALT_AS1");
          });

          it("should replace the value of the array of complex values property", () => {
            expect(config.arrayComplexValue.id).toBe("ALT_AC1");
          });
        });

        describe("with array of complex", () => {
          let otherRule: {
            select: { module: string };
            apply: {
              simpleValue: { $op: string; value: { id: string }[] };
              arraySimpleValue: { $op: string; value: { id: string }[] };
              complexValue: { $op: string; value: { id: string }[] };
            };
          };

          let config: any;

          beforeEach(async () => {
            otherRule = {
              select: {
                module: "test/type",
              },
              apply: {
                simpleValue: {
                  $op: "add",
                  value: [{ id: "ALT_S1" }],
                },
                arraySimpleValue: {
                  $op: "add",
                  value: [{ id: "ALT_AS1" }],
                },
                complexValue: {
                  $op: "add",
                  value: [{ id: "ALT_C1" }],
                },
              },
            };

            configurationService.add({ rules: [otherRule] });

            const result = await configurationService.selectAsync("test/type");
            config = result;
          });

          it("should replace the value of the simple value property", () => {
            expect(config.simpleValue[0].id).toBe("ALT_S1");
          });

          it("should append values to the array of simple values property", () => {
            expect(config.arraySimpleValue.length).toBe(3);

            expect(config.arraySimpleValue[0]).toBe("AS1");
            expect(config.arraySimpleValue[1]).toBe("AS2");

            expect(typeof config.arraySimpleValue[2]).toBe("object");
            expect(config.arraySimpleValue[2].id).toBe("ALT_AS1");
          });

          it("should replace the value of the complex value property", () => {
            expect(config.complexValue[0].id).toBe("ALT_C1");
          });
        });
      });
    });
  });
});
