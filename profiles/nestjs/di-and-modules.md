# NestJS Module Architecture & Dependency Injection

## 1. Module Definition Pattern
NestJS modules requiring configuration options should use `ConfigurableModuleBuilder` to generate strongly-typed dynamic module scaffolding.

```typescript
// foo.module-definition.ts
import { ConfigurableModuleBuilder } from '@nestjs/common';

export interface FooModuleOptions {
  apiKey: string;
  timeoutMs?: number;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<FooModuleOptions>()
    .setClassMethodName('register')
    .build();
```

```typescript
// foo.module.ts
import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './foo.module-definition';
import { FooService } from './foo.service';

@Module({
  providers: [FooService],
  exports: [FooService],
})
export class FooModule extends ConfigurableModuleClass {}
```

---

## 2. Encapsulation vs Globality (Rule BR-1)
- **Do not mark every module global:** Applying `@Global()` or `{ isGlobal: true }` everywhere turns NestJS into an unstructured global namespace.
- **Rule:** Keep leaf domain modules encapsulated. Export only public services. Globality is reserved for application-wide infrastructure (database connection, config, logging) configured exclusively in `AppModule`.
