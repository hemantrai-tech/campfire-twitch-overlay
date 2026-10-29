import parser from '@typescript-eslint/parser';
export default [{ ignores: ['dist/**','node_modules/**'] }, { files: ['**/*.ts'], languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } }, rules: {} }];
