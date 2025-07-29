module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    'prettier/prettier': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'no-console': 'warn', // Encourage use of a dedicated logger in actual modules
      'no-restricted-syntax': [
    'warn',
    {
      selector: "Property[key.name='needsAgent'][value.value!='SUNBELT_MODAL'][value.value!='UNITED_PDF'][value.value!='UNITED_CAPTCHA'][value.value!='PDF_DOWNLOAD']",
      message: 'needsAgent value has no matching Stagehand YAML file in .chatrunner directory',
    },
  ],  
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['node_modules', 'dist', '.turbo', 'coverage', '*.md'],
}; 
