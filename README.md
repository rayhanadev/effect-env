# @rayhanadev/env

Type-safe environment variable management for [Effect](https://effect.website). Like [t3-env](https://env.t3.gg), but for Effect.

## Installation

```bash
bun add @rayhanadev/env effect
# or
npm install @rayhanadev/env effect
# or
pnpm add @rayhanadev/env effect
```

## Usage

### Define your environment schema

```ts
import { Env, makeEnv } from "@rayhanadev/env";

export const AppEnv = makeEnv("AppEnv", {
  // Required variables
  databaseUrl: Env.string("DATABASE_URL"),
  port: Env.number("PORT"),

  // With defaults
  host: Env.stringOr("HOST", "localhost"),
  debug: Env.booleanOr("DEBUG", false),

  // Literal unions (type-safe enums)
  nodeEnv: Env.literalOr("NODE_ENV", "development", "development", "production", "test"),
  logLevel: Env.literal("LOG_LEVEL", "debug", "info", "warn", "error"),

  // Secrets (redacted in logs)
  apiKey: Env.redacted("API_KEY"),

  // Validated URLs
  apiBaseUrl: Env.url("API_BASE_URL"),

  // Optional (returns Option<T>)
  sentryDsn: Env.optionalString("SENTRY_DSN"),
});
```

### Use in your Effect program

```ts
import { Effect } from "effect";
import { AppEnv } from "./env";

const program = Effect.gen(function* () {
  const env = yield* AppEnv;

  console.log(`Starting server on ${env.host}:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`Debug mode: ${env.debug}`);
});

// Run with the default layer (loads from process.env)
Effect.runPromise(
  program.pipe(Effect.provide(AppEnv.Default))
);
```

### Error handling

If required environment variables are missing or invalid, Effect will fail with a `ConfigError`:

```ts
import { Effect, ConfigError } from "effect";

const program = Effect.gen(function* () {
  const env = yield* AppEnv;
  // ...
}).pipe(
  Effect.catchTag("ConfigError", (error) => {
    console.error("Configuration error:", error.message);
    return Effect.fail(error);
  })
);
```

## API Reference

### `makeEnv(id, shape)`

Creates a type-safe environment service from a configuration shape.

- **id**: A unique identifier for the service (used for debugging)
- **shape**: An object mapping keys to `Config` values

Returns an `EnvService` that:
- Can be used as an Effect Context Tag
- Provides a `.Default` Layer that loads from environment variables
- Provides a `.config` for use with `Effect.config`

### `Env` helpers

| Method | Description | Example |
|--------|-------------|---------|
| `Env.string(name)` | Required string | `Env.string("API_KEY")` |
| `Env.number(name)` | Required number | `Env.number("PORT")` |
| `Env.boolean(name)` | Required boolean | `Env.boolean("DEBUG")` |
| `Env.redacted(name)` | Required secret (redacted in logs) | `Env.redacted("SECRET")` |
| `Env.stringOr(name, default)` | String with default | `Env.stringOr("HOST", "localhost")` |
| `Env.numberOr(name, default)` | Number with default | `Env.numberOr("PORT", 3000)` |
| `Env.booleanOr(name, default)` | Boolean with default | `Env.booleanOr("DEBUG", false)` |
| `Env.optionalString(name)` | Optional string (`Option<string>`) | `Env.optionalString("OPTIONAL")` |
| `Env.optionalNumber(name)` | Optional number (`Option<number>`) | `Env.optionalNumber("TIMEOUT")` |
| `Env.literal(name, ...values)` | Required literal union | `Env.literal("ENV", "dev", "prod")` |
| `Env.literalOr(name, default, ...values)` | Literal with default | `Env.literalOr("ENV", "dev", "dev", "prod")` |
| `Env.url(name)` | Required validated URL | `Env.url("API_URL")` |

### Boolean values

The `boolean` and `booleanOr` methods accept the following values:

- **Truthy**: `"true"`, `"yes"`, `"on"`, `"1"`
- **Falsy**: `"false"`, `"no"`, `"off"`, `"0"`

## Comparison with t3-env

| Feature | @rayhanadev/env | t3-env |
|---------|-----------------|--------|
| Runtime | Effect | Zod |
| Type inference | Full | Full |
| Validation | Effect Config | Zod schemas |
| Dependency injection | Effect Context/Layer | None |
| Redacted secrets | Built-in | Manual |
| Framework agnostic | Yes | Next.js focused |

## License

MIT
