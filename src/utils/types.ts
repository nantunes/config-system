export interface IModuleWithDefaultExport {
  default: unknown;
}

export interface IPrioritizedConfig {
  priority?: number;
  config: object;
}

export interface IPrioritizedConfigWithOrdinal extends IPrioritizedConfig {
  ordinal: number;
}

/**
 * The `IEnvironment` interface allows access to environmental information of the Pentaho Platform.
 * For example, it allows access to
 * [user]{@link IEnvironment#user},
 * [theme]{@link IEnvironment#theme},
 * [locale]{@link IEnvironment#locale},
 * [application]{@link IEnvironment#application}
 * and
 * [server]{@link IEnvironment#server}.
 *
 * Not all information is always available, or sometimes it is not fixed,
 * and so some of these can be `null`. Check the documentation of each property and sub-property.
 *
 * @name IEnvironment
 * @interface
 */
export interface IEnvironment {
  /**
   * Gets the identifier of the client application.
   *
   * @name application
   * @memberOf IEnvironment#
   * @type {?nonEmptyString}
   * @readOnly
   */
  application?: string;

  /**
   * Gets information about the user.
   *
   * @name user
   * @memberOf IEnvironment#
   * @type {IUser}
   * @readOnly
   */
  user?: string;

  /**
   * Gets the identifier of the theme.
   *
   * @name theme
   * @memberOf IEnvironment#
   * @type {?nonEmptyString}
   * @readOnly
   */
  theme?: string;

  /**
   * Gets the identifier of the locale.
   *
   * @name locale
   * @memberOf IEnvironment#
   * @type {?nonEmptyString}
   * @readOnly
   */
  locale?: string;
}

/**
 * A `spec.EnvironmentPropertyFilter` represents the union of JS types that can be used to
 * filter the value of an [environment variable]{@link IEnvironment},
 * in the [select]{@link IRule#select} attribute
 * of a type configuration rule.
 *
 * A {@link Nully} filter is equivalent to not filtering a variable.
 * When unfiltered, any environment variable value is matched.
 *
 * An array filter matches an environment variable if any of the values in the array
 * are the same exact value of the environment variable.
 *
 * Any other value is assumed to be a single value, and matches the environment variable
 * if it is the same value.
 *
 * @typedef {*|Nully|Array} EnvironmentPropertyFilter
 */
export type EnvironmentPropertyFilter<T> = T | null | undefined | Array<T>;

/**
 * The `config.spec.IRuleSelector` interface describes
 * the criteria map that determines if a rule is selected
 * for a given module and environment variables.
 *
 * It is the type of the [select]{@link IRule#select} property
 * of a configuration rule.
 *
 * Besides the [module]{@link IRuleSelector#module} property,
 * this interface allows filtering on any of the [environment properties]{@link IEnvironment}.
 *
 * @name IRuleSelector
 * @interface
 *
 * @see IRule
 */
export interface IRuleSelector {
  /**
   * The identifier or identifiers of the modules that the rule applies to.
   *
   * When relative, these are relative to {@link IRuleSet#contextId}.
   * Also, if there are any applicable AMD/RequireJS mappings
   * to [contextId]{@link IRuleSet#contextId},
   * these are applied.
   *
   * @name module
   * @memberOf IRuleSelector#
   * @type {?EnvironmentPropertyFilter<string>}
   *
   * @see IRuleSet#contextId
   */
  module?: EnvironmentPropertyFilter<string>;

  /**
   * The identifier or identifiers of the application that the rule applies to.
   *
   * When relative, these are relative to {@link IRuleSet#contextId}.
   * Also, if there are any applicable AMD/RequireJS mappings
   * to [contextId]{@link IRuleSet#contextId},
   * these are applied.
   *
   * @name application
   * @memberOf IRuleSelector#
   * @type {?EnvironmentPropertyFilter<string>}
   */
  application?: EnvironmentPropertyFilter<string>;

  /**
   * The identifier or identifiers of the user that the rule applies to.
   *
   * @name user
   * @memberOf IRuleSelector#
   * @type {?EnvironmentPropertyFilter<string>}
   */
  user?: EnvironmentPropertyFilter<string>;

  /**
   * The identifier or identifiers of the theme that the rule applies to.
   *
   * @name theme
   * @memberOf IRuleSelector#
   * @type {?EnvironmentPropertyFilter<string>}
   */
  theme?: EnvironmentPropertyFilter<string>;

  /**
   * The identifier or identifiers of the locale that the rule applies to.
   *
   * @name locale
   * @memberOf IRuleSelector#
   * @type {?EnvironmentPropertyFilter<string>}
   */
  locale?: EnvironmentPropertyFilter<string>;
}

/**
 * The `config.spec.IRule` interface describes a configuration rule,
 * used to configure one or more types.
 *
 * A configuration rule is part of a [configuration rule set]{@link IRuleSet}.
 *
 * @name IRule
 * @interface
 *
 * @see IRuleSet
 */
export interface IRule {
  /**
   * The priority of the configuration rule.
   *
   * A rule's priority is the attribute that most influences its precedence order.
   *
   * @name priority
   * @memberOf IRule#
   * @type {number}
   * @default 0
   */
  priority?: number;

  /**
   * The criteria map that determines when a rule is selected for a
   * given type and environment variables.
   *
   * When the map is unspecified,
   * it is like every selection variable had been specified with a `null` value.
   *
   * @name select
   * @memberOf IRule#
   * @type {IRuleSelector}
   */
  select?: IRuleSelector;

  /**
   * The actual configuration specification that is _applied_ to the selected value type(s).
   *
   * Alternatively, if a function is specified,
   * it will be called with the value of any dependencies declared in [deps]{@link IRule#}
   * and it should return the final configuration object, or a {@link Nully} value, if it should be ignored.
   *
   * @name apply
   * @memberOf IRule#
   * @type {(Object|(function(...*) : Object))}
   */
  apply?: object | ((...args: unknown[]) => object);

  /**
   * The absolute identifiers of the modules that should be loaded
   * when the rule is selected for application.
   *
   * When relative, these are relative to {@link IRuleSet#contextId}.
   * Also, if there are any applicable AMD/RequireJS mappings
   * to [contextId]{@link IRuleSet#contextId},
   * these are applied.
   *
   * @name deps
   * @memberOf IRule#
   * @type {Array.<string>}
   *
   * @see IRuleSet#contextId
   */
  deps?: string[];
}

export interface IRuleWithOrdinal extends IRule {
  _ordinal: number;
}

/**
 * The `config.spec.IRuleSet` interface describes
 * a list of [configuration rules]{@link IRuleSet#rules}
 * used to configure one or more types.
 *
 * The following example is a hypothetical configuration,
 * where a developer (John) states that only he should see the visualization
 * he is currently developing (my/radial/bar) and
 * only then when working in Pentaho Analyzer:
 *
 * ```js
 * var myTypeConfig = {
 *   rules: [
 *     // Disable a still experimental Viz.
 *     {
 *       select: {
 *         type: "my/radial/bar"
 *       },
 *       apply: {
 *         isBrowsable: false
 *       }
 *     },
 *
 *     // Enable it, only for the dev user, "john", when in Analyzer
 *     {
 *       select: {
 *         type:        "my/radial/bar",
 *         user:        "john",
 *         application: "pentaho/analyzer"
 *       },
 *       apply: {
 *         isBrowsable: true
 *       }
 *     }
 *   ]
 * };
 * ```
 *
 * ### Rule Selection
 *
 * A rule is selected by a given type and environment variables,
 * if the type and variables match the rule's
 * [selection variables]{@link IRule#select}.
 *
 * ### Rule Specificity
 *
 * Rule specificity is a measure of the relevance of a rule.
 *
 * When two or more _selected_ rules configure the same specification attribute,
 * it is the value used by the most specific rule that wins.
 * When configured values are structural and are instead merged,
 * like with an {@link Object} value,
 * specificity determines the order in the merge operation
 * (most specific is merged over less specific).
 *
 * A rule is more specific than another if it:
 *
 * 1. has a greater [priority]{@link IRule#priority};
 *    this is the attribute that most affects specificity, and can be used to easily
 *    surpass every other affecting factors,
 * 2. selects a user (and the other doesn't),
 * 3. selects a theme (and the other doesn't),
 * 4. selects a locale (and the other doesn't),
 * 5. selects an application (and the other doesn't),
 * 6. belongs to a rule set that was added later, or
 * 7. it is at a greater index within a rule set.
 *
 * ### Rule's Configuration Merging
 *
 * Type configuration rules specify a _configuration_
 * in its [apply]{@link IRule#apply} property.
 *
 * When merging two configurations, the default behavior works this way:
 * 1. If both configurations contain a plain JavaScript object,
 *    in the same property, the two are deeply merged
 * 2. All other values, such as arrays, `null`, `undefined` or objects of custom classes, are replaced.
 *
 * To allow overriding the default merge behavior,
 * the following object syntax is supported in the place where any value would be:
 *
 * ```js
 * {
 *   fruits: {
 *     $op:   "add"
 *     value: ["banana", "apple"]
 *   }
 * }
 * ```
 *
 * In the previous example, the "add" operation is used to append new elements to an existing array
 * configuration value, instead of replacing it, as is the default.
 *
 * In the following example, the "replace" operation is used to replace an object configuration
 * value, instead of merging it, as is the default:
 *
 * ```js
 * {
 *   score: {
 *     $op:   "replace"
 *     value: {"banana": 1, "apple": 3, "orange": 2}
 *   }
 * }
 * ```
 *
 * Note that replacing with a {@link Nully} value effectively clears existing configurations.
 *
 * @name IRuleSet
 * @interface
 *
 * @see IService
 */
export interface IRuleSet {
  /**
   * The context module identifier to which module and dependency identifiers are relative
   * and that determines any applicable AMD/RequireJS module mappings.
   *
   * When unspecified and the rule set is registered and loaded from a module,
   * this property defaults to that module's identifier.
   *
   * @name contextId
   * @memberOf IRuleSet#
   * @type {?string}
   *
   * @see IRule#deps
   */
  contextId?: string;

  /**
   * The list of configuration rules.
   *
   * Within a type configuration,
   * if all other rule ordering criteria are equal,
   * the later configuration rules override the former configuration rules.
   *
   * @name rules
   * @memberOf IRuleSet#
   * @type {Array.<IRule>}
   */
  rules: IRule[];
}
