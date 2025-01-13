export interface Computed<T = any> extends ComputedFunctions<T> {
    (): T;
    (value: T): this;
  }
  
  export interface ComputedFunctions<T = any> extends Subscribable<T> {
    // It's possible for a to be undefined, since the equalityComparer is run on the initial
    // computation with undefined as the first argument. This is user-relevant for deferred computeds.
    equalityComparer(a: T | undefined, b: T): boolean;
    peek(): T;
    dispose(): void;
    isActive(): boolean;
    getDependenciesCount(): number;
    getDependencies(): Subscribable[];
  }
  
  
  export interface PureComputed<T = any> extends Computed<T> { }

  export type ComputedReadFunction<T = any, TTarget = void> = Subscribable<T> | Observable<T> | Computed<T> | ((this: TTarget) => T);
  export type ComputedWriteFunction<T = any, TTarget = void> = (this: TTarget, val: T) => void;
  export type MaybeComputed<T = any> = T | Computed<T>;


  export interface ComputedOptions<T = any, TTarget = void> {
      read?: ComputedReadFunction<T, TTarget>;
      write?: ComputedWriteFunction<T, TTarget>;
      owner?: TTarget;
      pure?: boolean;
      deferEvaluation?: boolean;
      disposeWhenNodeIsRemoved?: Node;
      disposeWhen?: () => boolean;
  }

  export function computed<T = any, TTarget = any>(options: ComputedOptions<T, TTarget>): Computed<T>;
  export function computed<T = any>(evaluator: ComputedReadFunction<T>): Computed<T>;
  export function computed<T = any, TTarget = any>(evaluator: ComputedReadFunction<T, TTarget>, evaluatorTarget: TTarget): Computed<T>;
  export function computed<T = any, TTarget = any>(evaluator: ComputedReadFunction<T, TTarget>, evaluatorTarget: TTarget, options: ComputedOptions<T, TTarget>): Computed<T>;
  export module computed {
      export const fn: ComputedFunctions;
  }

  export function pureComputed<T = any, TTarget = any>(options: ComputedOptions<T, TTarget>): PureComputed<T>;
  export function pureComputed<T = any>(evaluator: ComputedReadFunction<T>): PureComputed<T>;
  export function pureComputed<T = any, TTarget = any>(evaluator: ComputedReadFunction<T, TTarget>, evaluatorTarget: TTarget): PureComputed<T>;


  
  export function isComputed<T = any>(instance: any): instance is Computed<T>;
  export function isPureComputed<T = any>(instance: any): instance is PureComputed<T>;
