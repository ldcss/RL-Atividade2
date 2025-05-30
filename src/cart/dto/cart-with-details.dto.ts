import { Cart, CartItem, Product } from '@prisma/client';

// tipo para o carrinho retornado com itens e produtos
export type CartWithDetails = Cart & {
  items: (CartItem & { product: Product })[];
};
