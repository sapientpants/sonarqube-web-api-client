/**
 * Base builder class for all API builders
 */
export abstract class BaseBuilder<TRequest, TResponse = void> {
  protected params: Partial<TRequest> = {};

  constructor(protected executor: (params: TRequest) => Promise<TResponse>) {}

  /**
   * Set a parameter value
   */
  protected setParam<K extends keyof TRequest>(key: K, value: TRequest[K]): this {
    this.params[key] = value;
    return this;
  }

  /**
   * Set multiple parameters at once
   */
  protected setParams(params: Partial<TRequest>): this {
    Object.assign(this.params, params);
    return this;
  }

  /**
   * Execute the operation
   */
  abstract execute(): Promise<TResponse>;
}
