import path from 'node:path';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const MHD_FEATURE_CONTRACT_EXPORTS = new Set(['Hook', 'Schemas', 'Service', 'Types']);

function mhdNormalizePath(value) {
  return value.replaceAll('\\', '/');
}

function mhdGetOwningFeature(fileName) {
  const normalizedPath = mhdNormalizePath(fileName);
  const marker = '/src/features/';
  const markerIndex = normalizedPath.lastIndexOf(marker);
  if (markerIndex === -1) return null;

  const featureName = normalizedPath.slice(markerIndex + marker.length).split('/')[0];
  return featureName || null;
}

function mhdResolveFeatureImport(importPath, importingFileName) {
  if (importPath.startsWith('@/features/')) {
    const targetSegments = importPath.slice('@/features/'.length).split('/');
    return {
      featureName: targetSegments[0] || null,
      remainder: targetSegments.slice(1),
    };
  }

  if (!importPath.startsWith('.')) {
    return null;
  }

  const resolvedPath = mhdNormalizePath(path.resolve(path.dirname(importingFileName), importPath));
  const marker = '/src/features/';
  const markerIndex = resolvedPath.lastIndexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const targetSegments = resolvedPath.slice(markerIndex + marker.length).split('/');
  return {
    featureName: targetSegments[0] || null,
    remainder: targetSegments.slice(1),
  };
}

function mhdIsAllowedCrossFeatureImport(target) {
  if (!target?.featureName || target.remainder.length !== 1) {
    return false;
  }

  const leafName = target.remainder[0].replace(/\.(?:[cm]?ts|tsx|js|jsx)$/, '');
  return MHD_FEATURE_CONTRACT_EXPORTS.has(leafName);
}

const mhdFeatureBoundaryPlugin = {
  rules: {
    'no-cross-feature-internals': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require feature-to-feature imports to go through public contract files only.',
        },
        schema: [],
      },
      create(context) {
        const importingFileName = context.filename ?? context.getFilename();
        const owningFeature = mhdGetOwningFeature(importingFileName);
        if (!owningFeature) {
          return {};
        }

        return {
          ImportDeclaration(node) {
            const importPath = typeof node.source.value === 'string' ? node.source.value : null;
            if (!importPath) return;

            const target = mhdResolveFeatureImport(importPath, importingFileName);
            if (!target?.featureName || target.featureName === owningFeature) {
              return;
            }

            if (mhdIsAllowedCrossFeatureImport(target)) {
              return;
            }

            context.report({
              node: node.source,
              message:
                'Cross-feature imports must use the target feature public contract: Service.ts, Types.ts, Hook.ts, or Schemas.ts.',
            });
          },
        };
      },
    },
  },
};

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    plugins: {
      'mhd-feature-boundary': mhdFeatureBoundaryPlugin,
    },
    rules: {
      'mhd-feature-boundary/no-cross-feature-internals': 'error',
    },
  },
);
