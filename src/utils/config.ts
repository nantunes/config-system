import { ArgumentRequiredError } from "./errors";
import * as specUtil from "./json";
import { resolveModuleId } from "./module";
import {
  IRuleSelector,
  IRuleWithOrdinal,
  IPrioritizedConfigWithOrdinal,
  IModuleWithDefaultExport,
  IPrioritizedConfig,
  IEnvironment,
  IRuleSet,
  IRule,
} from "./types";
import { F, pushSorted } from "./utils";

/**
 * List of names of environment variables that are handled "generically" when sorting rules.
 * More specific first.
 */
const __selectCriteria: Array<keyof Omit<IRuleSelector, "module">> = [
  "user", // TODO: is now user.id and will not have effect as is
  "theme",
  "locale",
  "application",
];

const CRITERIA_COUNT = __selectCriteria.length;

/**
 * Compares two type configuration rules according to specificity.
 *
 * @param {IRule} r1 - The first type configuration rule.
 * @param {IRule} r2 - The second type configuration rule.
 *
 * @return {number} `-1`, if `r1` is more specific than `r2`,
 * `1`, if `r2` is more specific than `r1`,
 * and `0` if they have the same specificity.
 */
function __ruleComparer(r1: IRuleWithOrdinal, r2: IRuleWithOrdinal) {
  const priority1 = r1.priority || 0;
  const priority2 = r2.priority || 0;

  if (priority1 !== priority2) {
    return priority1 > priority2 ? 1 : -1;
  }

  const s1 = r1.select || {};
  const s2 = r2.select || {};

  for (let i = 0, ic = __selectCriteria.length; i !== ic; ++i) {
    const key = __selectCriteria[i];

    const isDefined1 = s1[key] != null;
    const isDefined2 = s2[key] != null;

    if (isDefined1 !== isDefined2) {
      return isDefined1 ? 1 : -1;
    }
  }

  return r1._ordinal > r2._ordinal ? 1 : -1;
}

function __prioritizedConfigComparer(
  pc1: IPrioritizedConfigWithOrdinal,
  pc2: IPrioritizedConfigWithOrdinal
) {
  const priority1 = pc1.priority || 0;
  const priority2 = pc2.priority || 0;

  if (priority1 !== priority2) {
    return priority1 > priority2 ? 1 : -1;
  }

  return pc1.ordinal > pc2.ordinal ? 1 : -1;
}

function __loadDependency(id: string): Promise<IModuleWithDefaultExport> {
  return import(/* @vite-ignore */ id);
}

function resolveId(idOrAlias: string, contextId?: string | URL): string {
  let path = resolveModuleId(idOrAlias, contextId?.toString());

  return (import.meta.resolve?.(path) as unknown as string) ?? path;
}

function __buildRuleKey(moduleId: string) {
  // just for the sake of the example, we'll remove the query part
  // vite adds a timestamp to the url
  const queryPartIndex = moduleId.indexOf("?");
  return queryPartIndex > 0 ? moduleId.substring(0, queryPartIndex) : moduleId;
}

function __mergeConfigs(configs: object[] | null) {
  return (
    configs &&
    configs.reduce((result, config) => {
      return specUtil.merge(result, config);
    }, {})
  );
}

function __sortAndMergePrioritizedConfigs(
  prioritizedConfigs: IPrioritizedConfig[]
) {
  // Sort and merge.
  // Ensure stable sort.
  const prioritizedConfigsWithOrdinal: IPrioritizedConfigWithOrdinal[] =
    prioritizedConfigs.map((prioritizedConfig, index) => {
      return {
        ...prioritizedConfig,
        ordinal: index,
      };
    });

  prioritizedConfigsWithOrdinal.sort(__prioritizedConfigComparer);

  return prioritizedConfigsWithOrdinal.reduce((result, prioritizedConfig) => {
    return specUtil.merge(result, prioritizedConfig.config);
  }, {});
}

function __wrapRuleConfigFactory(
  factory: (...args: unknown[]) => object,
  depIndexes: number[]
) {
  return function ruleConfigFactoryCaller(
    allDepValues: IModuleWithDefaultExport[]
  ) {
    // Collect this rule's dependencies.
    const depValues = depIndexes.map((depIndex) => {
      // TODO: Is it ok to assume the dependency value comes from the default export?
      return allDepValues[depIndex].default;
    });

    // Call the configuration factory.
    return factory(...depValues);
  };
}

export class ConfigurationService {
  /**
   * The ordinal value of the next rule that is registered.
   *
   * This is used as the fallback rule order.
   * Ensures sorting algorithm stability, because insertion order would be lost during a re-sort.
   *
   * @type {number}
   *
   * @see IService#addRule
   */
  private __ruleCounter = 0;

  private __environment: Partial<IEnvironment>;

  // public for testing and debugging
  public __ruleStore: Record<string, Array<IRuleWithOrdinal>>;

  /**
   * A function which, given module identifier, returns
   * a promise for an array, possibly null, of external configurations, including priorities.
   *
   * @type {?(function(string, string) : Promise.<?({priority: number, config: object})>)}
   * @private
   */
  private __selectExternalAsync:
    | ((moduleId: string) => Promise<IPrioritizedConfig[] | null>)
    | undefined;

  /**
   * @classDesc The `Service` class is an in-memory implementation of
   * the {@link IService} interface.
   *
   * @alias Service
   * @memberOf impl
   * @class
   * @extends Base
   * @implements {IService}
   *
   * @description Creates a configuration service instance for a given environment.
   *
   * @param {?IEnvironment} [environment] - The environment used to select configuration rules.
   * @param {function(string) : Promise.<?({priority: number, config: object})>} [selectExternalAsync]
   * - An asynchronous callback function for obtaining the external configuration of a module given its identifier.
   */
  constructor(
    environment?: IEnvironment | null,
    selectExternalAsync?: (
      moduleId: string
    ) => Promise<IPrioritizedConfig[] | null>
  ) {
    /**
     * The environment used to select configuration rules.
     * @type {IEnvironment}
     * @readOnly
     */
    this.__environment = environment || {};

    /**
     * A map connecting a module and annotation identifier to the applicable configuration rules,
     * ordered from least to most specific.
     *
     * @type {Object.<string, Array.<IRule>>}
     * @private
     *
     * @see __buildRuleKey
     */
    this.__ruleStore = Object.create(null);

    this.__selectExternalAsync = selectExternalAsync;
  }

  /**
   * Adds a configuration rule set.
   *
   * @param {?IRuleSet} ruleSet - A configuration rule set to add.
   */
  add(ruleSet: IRuleSet) {
    if (ruleSet && ruleSet.rules) {
      const contextId = ruleSet.contextId;

      ruleSet.rules.forEach((rule) => {
        this.addRule(rule, contextId);
      });
    }
  }

  /**
   * Adds a configuration rule.
   *
   * The insertion order is used as the fallback rule order.
   * For more information on the specificity of rules,
   * see [config.spec.IRuleSet]{@link IRuleSet}.
   *
   * Note that the specified rule object may be slightly modified to serve
   * the service's internal needs.
   *
   * @param {IRule} rule - The configuration rule to add.
   * @param {?string} [contextId] - The module identifier to which rule `modules` and `deps`
   * are relative to. Also, this module determines any applicable AMD/RequireJS mappings.
   *
   * @throw {OperationInvalidError} When `rule` has relative dependencies and `contextId`
   * is not specified.
   */
  addRule(newRule: IRule, contextId?: string) {
    // Assuming the Service takes ownership of the rules,
    // so mutating it directly is ok.
    const rule: IRuleWithOrdinal = newRule as IRuleWithOrdinal;
    rule._ordinal = this.__ruleCounter++;

    const select = rule.select || {};

    let moduleIds = select.module;
    if (!moduleIds) {
      throw new ArgumentRequiredError("rule.select.module");
    }

    const applicationId = select.application;
    if (applicationId) {
      if (Array.isArray(applicationId)) {
        select.application = applicationId.map((appId) => {
          return resolveId(appId, contextId);
        });
      } else {
        select.application = resolveId(applicationId, contextId);
      }
    }

    if (this.__applySelector(select)) {
      if (!Array.isArray(moduleIds)) {
        moduleIds = [moduleIds];
      }

      const depIds = rule.deps;
      if (depIds) {
        // Again, assuming the Service takes ownership of the rules,
        // so mutating it directly is ok.
        depIds.forEach((depId, index) => {
          depIds[index] = resolveId(depId, contextId);
        });
      }

      moduleIds.forEach((moduleId) => {
        if (!moduleId) {
          throw new ArgumentRequiredError("rule.select.module");
        }

        moduleId = resolveId(moduleId, contextId);

        this.__addRule(moduleId, rule);
      }, this);
    }
  }

  /**
   * Adds one rule to the rule store,
   * associated with a module and, optionally, an annotation,
   * given their identifiers.
   *
   * @param {string} moduleId - The module identifier.
   * @param {?string} annotationId - The annotation identifier.
   * @param {IRule} rule - The configuration rule to add.
   *
   * @private
   */
  __addRule(moduleId: string, rule: IRuleWithOrdinal) {
    const ruleKey = moduleId;

    let list = this.__ruleStore[ruleKey];
    if (!list) {
      list = [];
      this.__ruleStore[ruleKey] = list;
    }

    pushSorted(list, rule, __ruleComparer);
  }

  /**
   * Determines if a given rule selector selects the current environment.
   *
   * @param {IRuleSelector} select - A selector.
   *
   * @return {boolean} `true` if the selector selects the current environment; `false`, otherwise.
   * @private
   */
  __applySelector(select: IRuleSelector) {
    // Doing it backwards because `application` is the most common criteria...
    let i = CRITERIA_COUNT;
    const env = this.__environment;

    while (i--) {
      const key = __selectCriteria[i];

      const possibleValues = select[key];
      if (possibleValues != null) {
        const criteriaValue = env[key];
        if (criteriaValue !== undefined) {
          if (
            Array.isArray(possibleValues)
              ? possibleValues.indexOf(criteriaValue) === -1
              : possibleValues !== criteriaValue
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /** @inheritDoc */
  selectAsync(moduleId: string): Promise<any | null> {
    return this._selectLocalAsync(moduleId);
  }

  _selectLocalAsync(moduleId: string): Promise<any | null> {
    const internalConfigsPromise = this.__selectInternalAsync(moduleId);

    const selectExternalAsync = this.__selectExternalAsync;
    if (selectExternalAsync == null) {
      return internalConfigsPromise.then(__mergeConfigs);
    }

    const externalPrioritizedConfigsPromise = Promise.resolve(
      selectExternalAsync(moduleId)
    );

    return Promise.all([
      internalConfigsPromise,
      externalPrioritizedConfigsPromise,
    ]).then((results) => {
      const internalConfigs = results[0];
      const externalPrioritizedConfigs = results[1];

      if (externalPrioritizedConfigs == null) {
        return __mergeConfigs(internalConfigs);
      }

      if (internalConfigs === null) {
        return __sortAndMergePrioritizedConfigs(externalPrioritizedConfigs);
      }

      // Internal and external have to be merged together, or specUtil.merge does not
      // give the same result.

      const internalPrioritizedConfigs = internalConfigs.map((config) => {
        return { priority: 0, config };
      });

      externalPrioritizedConfigs.push.apply(
        externalPrioritizedConfigs,
        internalPrioritizedConfigs
      );

      return __sortAndMergePrioritizedConfigs(externalPrioritizedConfigs);
    });
  }

  /**
   * Selects, asynchronously, the internal configuration of a module, or a module annotation,
   * given their identifiers.
   *
   * @param {string} moduleId - The identifier of the module.
   * @param {?string} annotationId - The identifier of the module annotation.
   * @return {?Promise.<object[]>} A promise for the applicable configuration objects, ordered by priority;
   * `null`, if there are no applicable configuration rules.
   * @private
   */
  __selectInternalAsync(moduleId: string): Promise<object[] | null> {
    const ruleKey = __buildRuleKey(moduleId);
    const rules = this.__ruleStore[ruleKey];
    if (rules == null) {
      return Promise.resolve(null);
    }

    // Collect the dependencies of all rules and
    // load them all in parallel.
    let depPromisesList: Array<Promise<IModuleWithDefaultExport>> = [];
    let depIndexesById: Record<string, number> = {};

    const processDependency = (depId: string) => {
      let depIndex = depIndexesById[depId];
      if (depIndex == null) {
        depIndex = depPromisesList.length;
        depIndexesById[depId] = depIndex;
        depPromisesList.push(__loadDependency(depId));
      }

      return depIndex;
    };

    const createRuleConfigFactory = (rule: IRuleWithOrdinal) => {
      const isFun = F.is(rule.apply);
      const depIndexes: Array<number> = [];

      // Process rule dependencies.
      if (rule.deps) {
        if (depPromisesList === null) {
          depPromisesList = [];
          depIndexesById = Object.create(null);
        }

        rule.deps.forEach((depId) => {
          const depIndex = processDependency(depId);
          if (isFun) {
            depIndexes.push(depIndex);
          }
        });
      }

      return isFun
        ? __wrapRuleConfigFactory(
            rule.apply as (...args: unknown[]) => object,
            depIndexes
          )
        : F.constant(rule.apply as object);
    };

    // Collect all configs and start loading any dependencies.
    const configFactories = rules.map(createRuleConfigFactory);

    return Promise.all(depPromisesList || []).then((depValues) => {
      return configFactories.map((configFactory) => {
        return configFactory(depValues);
      });
    });
  }
}
