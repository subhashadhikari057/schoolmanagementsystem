// React ESLint Test File - Tests React-specific linting rules
import React, { useState, useEffect } from 'react';

// Test 1: Unused import (should be caught)
import { useMemo } from 'react';

// Test 2: Proper React component with TypeScript (should pass)
interface ComponentProps {
  title: string;
  count?: number;
  onUpdate?: (value: number) => void;
}

// Test 3: Functional component with proper typing (should pass)
const TestComponent: React.FC<ComponentProps> = ({
  title,
  count = 0,
  onUpdate,
}) => {
  const [localCount, setLocalCount] = useState<number>(count);

  // Test 4: Proper useEffect with dependencies (should pass)
  useEffect(() => {
    if (onUpdate) {
      onUpdate(localCount);
    }
  }, [localCount, onUpdate]);

  // Test 5: Event handler with proper typing (should pass)
  const handleIncrement = (): void => {
    setLocalCount(prev => prev + 1);
  };

  // Test 6: JSX with proper formatting (should pass after Prettier)
  return (
    <div className='test-component'>
      <h2>{title}</h2>
      <p>Count: {localCount}</p>
      <button onClick={handleIncrement} type='button'>
        Increment
      </button>
    </div>
  );
};

// Test 7: Another component to test exports
const AnotherComponent: React.FC = () => {
  return (
    <div>
      <TestComponent title='Test' count={5} />
    </div>
  );
};

export default TestComponent;
export { AnotherComponent };
