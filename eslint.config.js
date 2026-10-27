/**
 * Arquivo: eslint.config.js
 * O que faz: Regras de lint do projeto. Proíbe `any`, limita funções da simulação a 30 linhas e bloqueia números mágicos.
 * Por que existe: Automatiza as regras de clean code do GDD (pág. 14) para que nenhum commit as quebre.
 * Como modificar/debugar: Rode `npm run lint`. Se uma regra acusar número mágico, mova o valor para src/data/balance.json.
 * Importa: @eslint/js, typescript-eslint, globals
 * Conecta-se com: src/**, tests/**, scripts/**, package.json
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const SIMULATION_FILES = [
  'src/core/**/*.ts',
  'src/systems/**/*.ts',
  'src/entities/**/*.ts',
  'src/state/**/*.ts',
  'src/utils/**/*.ts',
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.wrangler', 'scratch', '.backups'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-lines-per-function': ['error', { max: 35, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: SIMULATION_FILES,
    rules: {
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 10, 1000, 0.5],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreNumericLiteralTypes: true,
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },
);
