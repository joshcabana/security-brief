import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const eslintApiPath = require.resolve('eslint');
const eslintDir = path.dirname(eslintApiPath);
const compatModulePath = require.resolve('@eslint/eslintrc', { paths: [eslintDir] });
const { FlatCompat } = require(compatModulePath);

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
  resolvePluginsRelativeTo: process.cwd(),
});

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**'],
  },
  ...compat.extends('next/core-web-vitals'),
];

export default eslintConfig;
