import { Config, ConfigError, Context, Either, Layer } from "effect";

/**
 * A collection of typed configuration helpers for environment variables.
 *
 * Each method returns an Effect `Config` that can be composed with `makeEnv`
 * to create a type-safe environment service.
 *
 * @example
 * ```ts
 * import { Env, makeEnv } from "@rayhanadev/env";
 *
 * const AppEnv = makeEnv("AppEnv", {
 *   port: Env.numberOr("PORT", 3000),
 *   databaseUrl: Env.string("DATABASE_URL"),
 *   nodeEnv: Env.literalOr("NODE_ENV", "development", "development", "production", "test"),
 * });
 * ```
 *
 * @since 1.0.0
 */
export const Env = {
  /**
   * Creates a required string configuration.
   *
   * @param name - The environment variable name
   * @returns A `Config<string>` that fails if the variable is missing
   *
   * @example
   * ```ts
   * const config = Env.string("API_KEY");
   * ```
   *
   * @since 1.0.0
   */
  string: (name: string) => Config.string(name),

  /**
   * Creates a required number configuration.
   *
   * @param name - The environment variable name
   * @returns A `Config<number>` that fails if the variable is missing or not a valid number
   *
   * @example
   * ```ts
   * const config = Env.number("PORT");
   * ```
   *
   * @since 1.0.0
   */
  number: (name: string) => Config.number(name),

  /**
   * Creates a required boolean configuration.
   *
   * Accepts "true", "yes", "on", "1" as truthy values and
   * "false", "no", "off", "0" as falsy values.
   *
   * @param name - The environment variable name
   * @returns A `Config<boolean>` that fails if the variable is missing or not a valid boolean
   *
   * @example
   * ```ts
   * const config = Env.boolean("DEBUG");
   * ```
   *
   * @since 1.0.0
   */
  boolean: (name: string) => Config.boolean(name),

  /**
   * Creates a required redacted (secret) configuration.
   *
   * The value is wrapped in a `Redacted` type that prevents accidental logging.
   *
   * @param name - The environment variable name
   * @returns A `Config<Redacted<string>>` that fails if the variable is missing
   *
   * @example
   * ```ts
   * const config = Env.redacted("SECRET_KEY");
   * // Use Redacted.value(secret) to access the actual value
   * ```
   *
   * @since 1.0.0
   */
  redacted: (name: string) => Config.redacted(name),

  /**
   * Creates an optional string configuration with a default value.
   *
   * @param name - The environment variable name
   * @param defaultValue - The value to use if the variable is missing
   * @returns A `Config<string>` that uses the default if the variable is missing
   *
   * @example
   * ```ts
   * const config = Env.stringOr("HOST", "localhost");
   * ```
   *
   * @since 1.0.0
   */
  stringOr: (name: string, defaultValue: string) =>
    Config.string(name).pipe(Config.withDefault(defaultValue)),

  /**
   * Creates an optional number configuration with a default value.
   *
   * @param name - The environment variable name
   * @param defaultValue - The value to use if the variable is missing
   * @returns A `Config<number>` that uses the default if the variable is missing
   *
   * @example
   * ```ts
   * const config = Env.numberOr("PORT", 3000);
   * ```
   *
   * @since 1.0.0
   */
  numberOr: (name: string, defaultValue: number) =>
    Config.number(name).pipe(Config.withDefault(defaultValue)),

  /**
   * Creates an optional boolean configuration with a default value.
   *
   * @param name - The environment variable name
   * @param defaultValue - The value to use if the variable is missing
   * @returns A `Config<boolean>` that uses the default if the variable is missing
   *
   * @example
   * ```ts
   * const config = Env.booleanOr("DEBUG", false);
   * ```
   *
   * @since 1.0.0
   */
  booleanOr: (name: string, defaultValue: boolean) =>
    Config.boolean(name).pipe(Config.withDefault(defaultValue)),

  /**
   * Creates an optional string configuration that returns `Option<string>`.
   *
   * @param name - The environment variable name
   * @returns A `Config<Option<string>>` - `Some(value)` if set, `None` if missing
   *
   * @example
   * ```ts
   * const config = Env.optionalString("OPTIONAL_FEATURE");
   * ```
   *
   * @since 1.0.0
   */
  optionalString: (name: string) => Config.string(name).pipe(Config.option),

  /**
   * Creates an optional number configuration that returns `Option<number>`.
   *
   * @param name - The environment variable name
   * @returns A `Config<Option<number>>` - `Some(value)` if set, `None` if missing
   *
   * @example
   * ```ts
   * const config = Env.optionalNumber("OPTIONAL_TIMEOUT");
   * ```
   *
   * @since 1.0.0
   */
  optionalNumber: (name: string) => Config.number(name).pipe(Config.option),

  /**
   * Creates a required configuration that must match one of the provided literal values.
   *
   * @param name - The environment variable name
   * @param values - The allowed literal values (at least one required)
   * @returns A `Config<T>` where T is the union of the provided literals
   *
   * @example
   * ```ts
   * const config = Env.literal("NODE_ENV", "development", "production", "test");
   * // Type is Config<"development" | "production" | "test">
   * ```
   *
   * @since 1.0.0
   */
  literal: <const T extends string>(
    name: string,
    ...values: readonly [T, ...T[]]
  ) =>
    Config.string(name).pipe(
      Config.mapOrFail((s) =>
        values.includes(s as T)
          ? Either.right(s as T)
          : Either.left(
              ConfigError.InvalidData(
                [],
                `Expected one of: ${values.join(", ")}`,
              ),
            ),
      ),
    ),

  /**
   * Creates a configuration with a default that must match one of the provided literal values.
   *
   * @param name - The environment variable name
   * @param defaultValue - The default value (must be one of the allowed values)
   * @param values - The allowed literal values (at least one required)
   * @returns A `Config<T>` where T is the union of the provided literals
   *
   * @example
   * ```ts
   * const config = Env.literalOr("LOG_LEVEL", "info", "debug", "info", "warn", "error");
   * // Type is Config<"debug" | "info" | "warn" | "error">
   * ```
   *
   * @since 1.0.0
   */
  literalOr: <const T extends string>(
    name: string,
    defaultValue: NoInfer<T>,
    ...values: readonly [T, ...T[]]
  ) =>
    Config.string(name).pipe(
      Config.withDefault(defaultValue),
      Config.mapOrFail((s) =>
        values.includes(s as T)
          ? Either.right(s as T)
          : Either.left(
              ConfigError.InvalidData(
                [],
                `Expected one of: ${values.join(", ")}`,
              ),
            ),
      ),
    ),

  /**
   * Creates a required URL configuration with validation.
   *
   * The URL is validated using the `URL` constructor.
   *
   * @param name - The environment variable name
   * @returns A `Config<string>` that fails if the variable is missing or not a valid URL
   *
   * @example
   * ```ts
   * const config = Env.url("API_BASE_URL");
   * ```
   *
   * @since 1.0.0
   */
  url: (name: string) =>
    Config.string(name).pipe(
      Config.mapOrFail((s) => {
        try {
          new URL(s);
          return Either.right(s);
        } catch {
          return Either.left(ConfigError.InvalidData([], "Invalid URL"));
        }
      }),
    ),
};

/**
 * Utility type that extracts the success types from a shape of Config values.
 * @internal
 */
type InferConfigShape<Shape extends Record<string, Config.Config<unknown>>> = {
  readonly [K in keyof Shape]: Config.Config.Success<Shape[K]>;
};

/**
 * A service interface that combines a Context Tag with configuration utilities.
 *
 * This interface extends Effect's `Context.Tag` and provides:
 * - `config`: The combined `Config` object for all environment variables
 * - `Default`: A `Layer` that loads the configuration from the environment
 *
 * @typeParam Id - The unique identifier string for the service
 * @typeParam Shape - The shape of the configuration object
 *
 * @since 1.0.0
 */
export interface EnvService<
  Id extends string,
  Shape extends Record<string, Config.Config<unknown>>,
> extends Context.Tag<EnvService<Id, Shape>, InferConfigShape<Shape>> {
  /**
   * The combined configuration object that can be used with `Effect.config`.
   */
  readonly config: Config.Config<InferConfigShape<Shape>>;
  /**
   * A Layer that provides this service by loading configuration from the environment.
   * Fails with `ConfigError` if required variables are missing or invalid.
   */
  readonly Default: Layer.Layer<EnvService<Id, Shape>, ConfigError.ConfigError>;
}

/**
 * Creates a type-safe environment service from a configuration shape.
 *
 * This is the main entry point for creating environment configurations.
 * It combines multiple `Config` values into a single service that can be
 * used with Effect's dependency injection system.
 *
 * @param id - A unique identifier for the service (used for debugging)
 * @param shape - An object mapping keys to `Config` values (use `Env.*` helpers)
 * @returns An `EnvService` that can be used as a Context Tag and provides a `Default` Layer
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Env, makeEnv } from "@rayhanadev/env";
 *
 * // Define your environment schema
 * const AppEnv = makeEnv("AppEnv", {
 *   port: Env.numberOr("PORT", 3000),
 *   databaseUrl: Env.string("DATABASE_URL"),
 *   nodeEnv: Env.literalOr("NODE_ENV", "development", "development", "production", "test"),
 *   apiKey: Env.redacted("API_KEY"),
 * });
 *
 * // Use in your Effect program
 * const program = Effect.gen(function* () {
 *   const env = yield* AppEnv;
 *   console.log(`Starting server on port ${env.port}`);
 * });
 *
 * // Run with the default layer (loads from process.env)
 * Effect.runPromise(program.pipe(Effect.provide(AppEnv.Default)));
 * ```
 *
 * @since 1.0.0
 */
export const makeEnv = <
  const Id extends string,
  const Shape extends Record<string, Config.Config<unknown>>,
>(
  id: Id,
  shape: Shape,
): EnvService<Id, Shape> => {
  const config = Config.all(shape) as Config.Config<InferConfigShape<Shape>>;

  const tag = Context.GenericTag<
    EnvService<Id, Shape>,
    InferConfigShape<Shape>
  >(id);

  const Default = Layer.effect(tag, config);

  return Object.assign(tag, { config, Default });
};
