import { OperationInvalidError } from "./errors";
import { O } from "./utils";

/**
 * Checks if a value is a plain JavaScript object.
 *
 * @param {*} value - The value to check.
 *
 * @return {boolean} `true` if it is; `false` if is not.
 *
 * @private
 */
function __isPlainJSObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && value.constructor === Object;
}

/**
 * Creates a deep, own clone of a given value.
 *
 * For plain object values, only their _own_ properties are included.
 *
 * @param {any} value - The value to clone deeply.
 *
 * @return {any} The deeply cloned value.
 *
 * @private
 */
function __cloneOwnDeep(value: any | null): unknown {
  let clone = value;

  if (value && typeof value === "object") {
    if (value instanceof Array) {
      clone = value.map(__cloneOwnDeep);
    } else if (value.constructor === Object) {
      clone = {};
      O.eachOwn(
        value,
        (vi, p) => {
          (clone as any)[p] = __cloneOwnDeep(vi);
        },
        clone
      );
    }
  }

  return clone;
}

/**
 * Replaces the target value with a deep, own clone of the source value.
 *
 * @param {object} target - The target object.
 * @param {string} name - The source property name.
 * @param {*} sourceValue - The source property value.
 *
 * @private
 */
function __mergeOperReplace(target: any, name: PropertyKey, sourceValue: any) {
  // Clone source value so that future merges into it don't change it, inadvertently.
  target[name] = __cloneOwnDeep(sourceValue);
}

/**
 * Merges one property into a target object,
 * given the source property name and value.
 *
 * @param {object} target - The target object.
 * @param {string} name - The source property name.
 * @param {*} sourceValue - The source property value.
 *
 * @private
 */
function __mergeOne(target: object, name: string, sourceValue: any) {
  let op: keyof typeof _mergeHandlers | undefined;
  let value = sourceValue;

  if (__isPlainJSObject(value)) {
    // Is `sourceValue` an operation structure?
    //   {$op: "merge", value: {}}
    op = value.$op as keyof typeof _mergeHandlers;
    if (op) {
      // Always deref source value, whether or not `op` is merge.
      value = sourceValue.value;

      // Merge operation only applies between two plain objects and
      // add operation only applies between two arrays.
      // Otherwise behaves like _replace_.
      if (
        (op === "merge" && !__isPlainJSObject(value)) ||
        (op === "add" && !Array.isArray(value))
      ) {
        op = "replace";
      }
    } else {
      op = "merge";
    }
  }

  const handler = _mergeHandlers[op ?? "replace"];
  if (!handler)
    throw new OperationInvalidError(`Merge operation '${op}' is not defined.`);

  handler(target, name, value);
}

/**
 * Merges a specification into another.
 *
 * The target specification is modified,
 * but the source specification isn't.
 * The latter is actually deep-cloned, whenever full-subtrees are set at a target place,
 * to prevent future merges from inadvertently changing the source's internal structures.
 *
 * @memberOf pentaho.util.spec
 * @param {object} specTarget - The target specification.
 * @param {?object} specSource - The source specification.
 *
 * @return {object} The target specification.
 */
function merge(specTarget: object, specSource: any | null): object {
  for (const name in specSource)
    if (O.hasOwn(specSource, name))
      __mergeOne(specTarget, name, specSource[name]);

  return specTarget;
}

/**
 * Performs the merge operation when the target value is also a plain object,
 * or replaces it, if not.
 *
 * @param {object} target - The target object.
 * @param {string} name - The source property name.
 * @param {object} sourceValue - The source property value.
 *
 * @private
 */
function __mergeOperMerge(target: any, name: string, sourceValue: object) {
  // Is `targetValue` also a plain object?
  const targetValue = target[name];
  if (__isPlainJSObject(targetValue)) merge(targetValue, sourceValue);
  else __mergeOperReplace(target, name, sourceValue);
}

/**
 * When both the source and target values are arrays,
 * appends the source elements to the target array.
 * Otherwise, replaces the target array with a deep,
 * own clone of the source array.
 *
 * @param {object} target - The target object.
 * @param {string} name - The source property name.
 * @param {*} sourceValue - The source property value.
 *
 * @private
 */
function __mergeOperAdd(target: any, name: string, sourceValue: any) {
  // If both are arrays, append source to target, while cloning source elements.
  // Else, fallback to replace operation.
  const targetValue = target[name];
  if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
    let i = -1;
    const L = sourceValue.length;
    while (++i < L) targetValue.push(__cloneOwnDeep(sourceValue[i]));
  } else {
    __mergeOperReplace(target, name, sourceValue);
  }
}

/**
 * Map of merge operation name to operation handler function.
 *
 * @type {?Object.<string, Function>}
 * @see __mergeOne
 */
const _mergeHandlers = {
  replace: __mergeOperReplace,
  merge: __mergeOperMerge,
  add: __mergeOperAdd,
};

/**
 * The `util.spec` contains utilities related with handling of specification objects.
 *
 * @name pentaho.util.spec
 * @class
 * @amd pentaho/util/spec
 */
export { /** @lends pentaho.util.spec */ merge };
