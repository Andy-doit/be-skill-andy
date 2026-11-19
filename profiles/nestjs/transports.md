# NestJS Transports: REST & GraphQL

## 1. REST Controllers (Rule BE-24)
Keep controllers thin. Parse and validate parameters with DTOs, execute guards, delegate to service, and map to response models:

```typescript
@Controller({ path: 'orders', version: '1' })
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createOrder(@Body() dto: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const result = await this.orderService.createOrder(dto.toParams());
    return CreateOrderResponseDto.fromResult(result);
  }
}
```

---

## 2. GraphQL Resolvers
Resolvers in NestJS GraphQL (Apollo Federation) should encapsulate single operations or coherent resource queries:

```typescript
@Resolver(() => OrderType)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Query(() => OrderType, { description: 'Fetches order by unique identifier' })
  async order(@Args('input') input: GetOrderInput): Promise<OrderType> {
    return this.orderService.getOrder(input.toParams());
  }
}
```

---

## 3. Global Exception Filters (Rule BE-20)
Map internal exceptions to standardized HTTP and GraphQL error shapes without exposing SQL errors or stack traces:

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainException) {
      return response.status(exception.httpStatus).json({
        code: exception.code,
        message: exception.message,
      });
    }

    // Never leak unhandled stack traces to clients
    return response.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
    });
  }
}
```
