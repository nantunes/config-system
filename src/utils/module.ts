import { OperationInvalidError } from "./errors";

/**
 * The `util` namespace contains utility function for working with modules.
 *
 * @namespace
 * @memberOf pentaho.module
 * @amd pentaho/module/util
 */

export function getBaseIdOf(id: string) {
  return id && id.replace(/.[^/]+$/, "");
}

export function absolutizeIdRelativeToSibling(id: any, siblingId: any) {
  return absolutizeId(id, getBaseIdOf(siblingId));
}

export function absolutizeId(id: string, baseId: string) {
  if (id && /^\./.test(id) && !/\.js$/.test(id)) {
    var baseIds = baseId ? baseId.split("/") : [];
    var ids = id.split("/");
    var needsBase = false;

    while (ids.length) {
      var segment = ids[0];
      if (segment === ".") {
        ids.shift();
        needsBase = true;
      } else if (segment === "..") {
        if (!baseIds.pop()) {
          throw new OperationInvalidError("Invalid path: '" + id + "'.");
        }
        ids.shift();
        needsBase = true;
      } else {
        break;
      }
    }

    if (needsBase) {
      baseId = baseIds.join("/");
      id = ids.join("/");

      return baseId && id ? baseId + "/" + id : baseId || id;
    }
  }

  return id;
}

/**
 * Resolves a module identifier as if it were a dependency of another module.
 *
 * Resolving makes `moduleId` absolute, relative to `dependentId`.
 *
 * Afterwards, any applicable RequireJS contextual mapping configuration is applied.
 *
 * @param {string} moduleId - The identifier of the module to be resolved.
 * @param {?string} dependentId - The module that depends on `moduleId`.
 * @return {string} The identifier of the resolved module.
 */
export function resolveModuleId(moduleId: string, dependentId: any) {
  return absolutizeIdRelativeToSibling(moduleId, dependentId);
}
