// Prettier Test File - Intentionally poorly formatted
// This file will be auto-formatted by Prettier

const poorlyFormatted = {
  name: 'test',
  value: 123,
  items: [1, 2, 3, 4, 5],
  nested: {
    key: 'value',
    another: true,
  },
};

function badlyFormattedFunction(param1: string, param2: number) {
  return {
    result: `${param1}-${param2}`,
    timestamp: new Date().toISOString(),
  };
}

// Mixed quotes and spacing
const mixedQuotes = 'This should become single quotes';
const spacingIssues = 'This has spacing problems';

// Long line that should be wrapped
const veryLongLine =
  'This is a very long line that exceeds the printWidth configuration and should be wrapped by Prettier automatically to maintain readability';

// Array formatting
const poorArray = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

// Object with trailing commas
const objectWithoutTrailingCommas = {
  first: 'value',
  second: 123,
  third: true,
};

export {
  poorlyFormatted,
  badlyFormattedFunction,
  mixedQuotes,
  spacingIssues,
  veryLongLine,
  poorArray,
  objectWithoutTrailingCommas,
};
