import {
  isValidIdentifier,
  isValidIdentifierCamelized,
  toCamelCase,
  toPascalCase,
} from '../src';

it('should convert strings to PascalCase', () => {
  expect(toPascalCase('hello_world')).toBe('HelloWorld');
  expect(toPascalCase('hello world')).toBe('HelloWorld');
  expect(toPascalCase('hello-world')).toBe('HelloWorld');
  expect(toPascalCase('Hello-World')).toBe('HelloWorld');
});

it('should convert strings to camelCase', () => {
  expect(toCamelCase('hello_world')).toBe('helloWorld');
  expect(toCamelCase('hello world')).toBe('helloWorld');
  expect(toCamelCase('hello-world')).toBe('helloWorld');
  expect(toCamelCase('Hello-World')).toBe('helloWorld');
  expect(toCamelCase('_hello_world')).toBe('helloWorld');
  expect(toCamelCase('123hello_world')).toBe('123helloWorld');
});

it('should validate valid JavaScript identifiers', () => {
  expect(isValidIdentifier('validIdentifier')).toBe(true);
  expect(isValidIdentifier('$validIdentifier')).toBe(true);
  expect(isValidIdentifier('_validIdentifier')).toBe(true);
  expect(isValidIdentifier('1invalidIdentifier')).toBe(false);
  expect(isValidIdentifier('invalid-Identifier')).toBe(false);
});

it('should validate valid JavaScript-like identifiers allowing internal hyphens', () => {
  expect(isValidIdentifierCamelized('valid-identifier')).toBe(true);
  expect(isValidIdentifierCamelized('$valid-identifier')).toBe(true);
  expect(isValidIdentifierCamelized('_valid-identifier')).toBe(true);
  expect(isValidIdentifierCamelized('1invalid-identifier')).toBe(false);
  expect(isValidIdentifierCamelized('-invalid-identifier')).toBe(false);
  expect(isValidIdentifierCamelized('invalid-identifier-')).toBe(true);
});

describe('toPascalCase', () => {
  test('converts normal string', () => {
    expect(toPascalCase('hello_world')).toBe('HelloWorld');
  });

  test('converts string with multiple underscores and mixed case', () => {
    expect(toPascalCase('Object_ID')).toBe('ObjectID');
    expect(toPascalCase('Postgre_SQL_View')).toBe('PostgreSQLView');
    expect(toPascalCase('postgre_sql_view')).toBe('PostgreSqlView');
  });

  test('handles string with multiple separators together', () => {
    expect(toPascalCase('hello___world--great')).toBe('HelloWorldGreat');
  });

  test('handles single word', () => {
    expect(toPascalCase('word')).toBe('Word');
  });

  test('handles empty string', () => {
    expect(toPascalCase('')).toBe('');
  });

  test('handles string with numbers', () => {
    expect(toPascalCase('version1_2_3')).toBe('Version123');
  });
});

describe('toCamelCase', () => {
  test('converts hyphenated string', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld');
  });

  test('converts underscored string', () => {
    expect(toCamelCase('hello_world')).toBe('helloWorld');
  });

  test('converts spaces', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
  });

  test('handles mixed separators', () => {
    expect(toCamelCase('hello-world_now what')).toBe('helloWorldNowWhat');
  });

  test('handles empty string', () => {
    expect(toCamelCase('')).toBe('');
  });

  test('handles string starting with separators', () => {
    expect(toCamelCase('-hello_world')).toBe('helloWorld');
  });

  test('handles string with multiple separators together', () => {
    expect(toCamelCase('hello___world--great')).toBe('helloWorldGreat');
  });
});
