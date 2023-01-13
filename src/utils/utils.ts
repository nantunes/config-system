export function pushSorted<T>(
  list: T[],
  el: T,
  compareFn: (a: T, b: T) => number
) {
  list.splice(
    ((arr) => {
      let left = 0;
      let right = arr.length;

      while (left < right) {
        const middle = (left + right) >>> 1;
        const cmp = compareFn(el, arr[middle]);

        if (cmp > 0) left = middle + 1;
        else right = middle;
      }

      return left;
    })(list),
    0,
    el
  );

  return list.length;
}

export const F = {
  /**
   * Determine if the value passed is a function.
   *
   * @param value Value to be tested.
   * @returns Whether the value is a function.
   */
  is: (value: unknown): value is Function => {
    return typeof value === "function";
  },

  /**
   * Creates a function that always returns the same value.
   *
   * @param value Value to be return by the constant function.
   * @return A constant function.
   */
  constant: <T>(value: T): (() => T) => {
    return (): T => {
      return value;
    };
  },
};

const O_hasOwn = Object.prototype.hasOwnProperty;

export const O = {
  /**
   * Iterates over all **direct enumerable** properties of an object,
   * yielding each in turn to an iteratee function.
   *
   * The iteratee is bound to the context object, if one is passed,
   * otherwise it is bound to the iterated object.
   * Each invocation of iteratee is called with two arguments: (propertyValue, propertyName).
   * If the iteratee function returns `false`, the iteration loop is broken out.
   *
   * @param {?(object|function)} o - The object containing the properties to be iterated.
   * @param {function} fun - The function that will be iterated.
   * @param {?object} [x] - The object which will provide the execution context of the iteratee function.
   * If nully, the iteratee will run with the context of the iterated object.
   *
   * @return {boolean} `true` when the iteration completed regularly,
   * or `false` if the iteration was forcefully terminated.
   */
  eachOwn(
    o: any | null,
    fun: (v: unknown, k: PropertyKey) => unknown | boolean,
    x?: object | null
  ): boolean {
    for (const p in o) {
      if (O_hasOwn.call(o, p) && fun.call(x || o, o[p], p) === false)
        return false;
    }

    return true;
  },

  /**
   * Determines if a property is a direct property of an object.
   *
   * This method does not check down the object's prototype chain.
   *
   * If the specified object is a {@link Nully} value, `false` is returned.
   *
   * @param {?(object|function)} o - The object to be tested.
   * @param {PropertyKey} p - The name of the property.
   * @return {boolean} `true` if this is a direct/own property, or `false` otherwise.
   */
  hasOwn(o: object | null, p: PropertyKey): boolean {
    return !!o && O_hasOwn.call(o, p);
  },
};
