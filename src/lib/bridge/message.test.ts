import { createEnvelope } from './message';

describe('createEnvelope', () => {
  it('creates envelope with correct priority', () => {
    const env = createEnvelope({
      sessionId: '01TEST',
      priority: 'head',
      content: 'test content',
      sender: 'user',
    });
    expect(env.priority).toBe('head');
    expect(env.content).toBe('test content');
    expect(env.sender).toBe('user');
    expect(env.sessionId).toBe('01TEST');
  });

  it('generates a 26-character ULID for id', () => {
    const env = createEnvelope({
      sessionId: '01TEST',
      priority: 'body',
      content: 'x',
      sender: 'agent',
    });
    expect(env.id).toHaveLength(26);
    expect(env.id).toMatch(/^[0-9A-Z]{26}$/);
  });

  it('sets createdAt as a number (ms epoch)', () => {
    const before = Date.now();
    const env = createEnvelope({
      sessionId: '01TEST',
      priority: 'tail',
      content: 'ts-test',
      sender: 'router',
    });
    const after = Date.now();
    expect(typeof env.createdAt).toBe('number');
    expect(env.createdAt).toBeGreaterThanOrEqual(before);
    expect(env.createdAt).toBeLessThanOrEqual(after);
  });

  it('does not set consumedAt on creation', () => {
    const env = createEnvelope({
      sessionId: '01TEST',
      priority: 'head',
      content: 'x',
      sender: 'user',
    });
    expect(env.consumedAt).toBeUndefined();
  });
});
