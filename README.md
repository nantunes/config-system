# About

This a quick'n'dirty adaption of the [Pentaho Configuration API](https://help.hitachivantara.com/Documentation/Pentaho/9.4/Developer_center/Configuration_API), part of the [Pentaho Platform JavaScript APIs](https://help.hitachivantara.com/Documentation/Pentaho/9.4/Developer_center/Platform_JavaScript_APIs), for use with ES modules.

The original code is available at https://github.com/pentaho/pentaho-platform-plugin-common-ui/tree/master/impl/client/src/main/javascript/web/pentaho.

It was transformed to TypeScript. Removed support for annotations and the synergies with the [Pentaho Type API](https://help.hitachivantara.com/Documentation/Pentaho/9.4/Developer_center/Platform_JavaScript_APIs/platform/pentaho.type) (so no notion of types, instances, inheritance, etc.).

## How to install

```bash
npm install
```

## How to run (dev mode, "pure" ES modules)

```bash
npm run dev
```

## How to run (production mode, "bundled" ES modules)

```bash
npm run build
npm run preview
```

## How to run the test suite

```bash
npm run test
```

### Next steps

1. Try using import maps;
2. Install es-module-shims for supporting Safari;
