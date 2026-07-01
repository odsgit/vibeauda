module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  // Deno Edge Function source — separate runtime/toolchain, not part of
  // either tsconfig project, and not linted by this Node-oriented config.
  ignorePatterns: ['supabase/functions/**'],
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.app.json', './tsconfig.node.json'],
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'react/require-default-props': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'vite.config.ts',
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
        ],
      },
    ],
  },
};
