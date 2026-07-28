import { greet } from './core';

describe('greet', () => {
  it('returns Hello, World! with no argument', () => {
    expect(greet()).toBe('Hello, World!');
  });

  it('returns Hello, World! with explicit World argument', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  it('returns Hello, Stratidian! for named input', () => {
    expect(greet('Stratidian')).toBe('Hello, Stratidian!');
  });

  it('handles single-word name correctly', () => {
    expect(greet('Alice')).toBe('Hello, Alice!');
  });

  it('handles name with spaces (passed as single string)', () => {
    expect(greet('Suite Cascade')).toBe('Hello, Suite Cascade!');
  });
});
