import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const nextPluginModule = await import('@next/eslint-plugin-next').catch(async () =>
  await import('./eslint/next-plugin-stub.js'),
)
const nextPlugin = nextPluginModule.default ?? nextPluginModule
const nextRecommendedRules = nextPlugin?.configs?.recommended?.rules ?? {}

export default [
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        process: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...nextRecommendedRules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-undef': 'error',
    },
  },
  {
    files: ['app/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off', // Next.js app directory has different rules
    },
  },
]
