// Global Jest type declarations for TypeScript tests
import { jest, describe, expect, it, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

declare global {
  const jest: typeof import('@jest/globals').jest;
  const describe: typeof import('@jest/globals').describe;
  const expect: typeof import('@jest/globals').expect;
  const it: typeof import('@jest/globals').it;
  const beforeEach: typeof import('@jest/globals').beforeEach;
  const afterEach: typeof import('@jest/globals').afterEach;
  const beforeAll: typeof import('@jest/globals').beforeAll;
  const afterAll: typeof import('@jest/globals').afterAll;
  
  namespace jest {
    interface Mock<T = any> extends Function {
      new (...args: any[]): T;
      (...args: any[]): any;
      mockImplementation(fn: (...args: any[]) => any): this;
      mockImplementationOnce(fn: (...args: any[]) => any): this;
      mockReturnValue(value: any): this;
      mockReturnValueOnce(value: any): this;
      mockResolvedValue(value: any): this;
      mockResolvedValueOnce(value: any): this;
      mockRejectedValue(value: any): this;
      mockRejectedValueOnce(value: any): this;
      mockReturnThis(): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
      mockName(name: string): this;
    }
  }
}