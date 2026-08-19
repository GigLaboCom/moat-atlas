import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', '.astro/', 'node_modules/'],
  },
  // Astro files — must come before tseslint rules so the Astro parser wins
  ...eslintPluginAstro.configs['flat/recommended'],
  // TypeScript rules scoped to TS/MJS files only (avoid fighting the Astro parser)
  {
    files: ['**/*.ts', '**/*.mjs'],
    extends: [...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Inline <script> blocks in .astro files are linted through virtual paths that
  // `**/*.astro` patterns do not match — relax the noisiest rules globally.
  {
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  },
);
