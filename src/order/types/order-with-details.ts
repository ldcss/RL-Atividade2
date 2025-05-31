import { Order, OrderItem } from '@prisma/client';

export type OrderWithDetails = Order & {
  user: { id: string; email: string; name: string | null };
  items: (OrderItem & { product: { id: string; title: string; description: string | null } })[];
};
