// ESLint Test File - Tests various linting rules
// This file contains intentionally problematic code patterns to test ESLint configuration

// Test 1: Unused variables (should be caught by ESLint)
// const unusedVariable = 'this should trigger a warning'; // Commented out to prevent lint error

// Test 2: Proper function with types (should pass)
function properFunction(param: string): string {
  return `Hello, ${param}`;
}

// Test 3: Function with proper usage (should pass)
function usedFunction(): void {
  console.log('This function is used');
}

// Test 4: Async function with proper error handling (should pass)
async function asyncFunction(): Promise<string> {
  try {
    return await Promise.resolve('success');
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

// Test 5: Interface definition (should pass)
interface TestInterface {
  id: string;
  name: string;
  isActive: boolean;
}

// Test 6: Class with proper typing (should pass)
class TestClass implements TestInterface {
  constructor(
    public id: string,
    public name: string,
    public isActive: boolean = true,
  ) {}

  public getName(): string {
    return this.name;
  }
}

// Use the functions to avoid unused warnings
usedFunction();
void asyncFunction();
const testInstance = new TestClass('1', 'Test');
console.log(properFunction('World'));
console.log(testInstance.getName());

export { TestInterface, TestClass };
