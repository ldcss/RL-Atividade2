import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { OrderStatus } from '../src/order/types/order-status';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const SALT_ROUNDS = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 10;

async function main() {
  console.log(`Start seeding ...`);

  const hashedPasswordUser1 = await bcrypt.hash('password123', SALT_ROUNDS);
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Wonderland',
      password: hashedPasswordUser1,
    },
  });

  const hashedPasswordUser2 = await bcrypt.hash('password456', SALT_ROUNDS);
  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob The Builder',
      password: hashedPasswordUser2,
    },
  });
  console.log(`Created users: ${user1.name}, ${user2.name}`);

  // cria produtos
  const product1 = await prisma.product.create({
    data: {
      title: 'Laptop Pro X',
      description: 'Um laptop poderoso para profissionais.',
      price: 1200.99,
      originalPrice: 1500.0,
      category: 'Eletrônicos',
    },
  });

  const product2 = await prisma.product.create({
    data: {
      title: 'Cafeteira MasterBrew',
      description: 'Faça o café perfeito todas as manhãs.',
      price: 89.5,
      category: 'Casa e Cozinha',
    },
  });

  const product3 = await prisma.product.create({
    data: {
      title: 'Livro: A Arte da Guerra',
      description: 'Estratégias clássicas de Sun Tzu.',
      price: 19.9,
      originalPrice: 25.0,
      category: 'Livros',
    },
  });
  console.log(`Created products: ${product1.title}, ${product2.title}, ${product3.title}`);

  // alice favorita o laptop e o livro
  await prisma.favorite.createMany({
    data: [
      { userId: user1.id, productId: product1.id },
      { userId: user1.id, productId: product3.id },
    ],
  });
  // bob favorita a cafeteira
  await prisma.favorite.createMany({
    data: [{ userId: user2.id, productId: product2.id }],
  });
  console.log(`Created favorites.`);

  // criar carrinho e itens para alice
  const cartAlice = await prisma.cart.upsert({
    where: { userId: user1.id },
    update: {},
    create: { userId: user1.id },
    include: { items: true },
  });

  // limpar itens existentes do carrinho de Alice para idempotência do seed
  await prisma.cartItem.deleteMany({ where: { cartId: cartAlice.id } });

  // adicionar itens ao carrinho de Alice
  await prisma.cartItem.createMany({
    data: [
      { cartId: cartAlice.id, productId: product1.id, quantity: 1 },
      { cartId: cartAlice.id, productId: product2.id, quantity: 2 },
    ],
  });
  console.log(`Created cart with items for ${user1.name}.`);

  // bob compra 1 cafeteira e 1 livro
  const orderBob = await prisma.order.create({
    data: {
      userId: user2.id,
      status: OrderStatus.PENDING,
      totalAmount: 0,
      items: {
        createMany: {
          data: [
            {
              productId: product2.id,
              quantity: 1,
              priceAtPurchase: product2.price,
            },
            {
              productId: product3.id,
              quantity: 1,
              priceAtPurchase: product3.price,
            },
          ],
        },
      },
    },
  });

  // calcula e atualiza o totalAmount de Bob
  const totalBob = product2.price * 1 + product3.price * 1;
  await prisma.order.update({
    where: { id: orderBob.id },
    data: { totalAmount: totalBob },
  });
  console.log(`Created an order for ${user2.name} with total ${totalBob}.`);

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
