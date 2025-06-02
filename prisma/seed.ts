import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { OrderStatus } from '../src/order/types/order-status';
import { UserRole } from '../src/user/type/UserRole';

// Carregue as variáveis de ambiente do arquivo .env
dotenv.config();

const prisma = new PrismaClient();

const SALT_ROUNDS = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 10;

if (isNaN(SALT_ROUNDS) || (SALT_ROUNDS === 10 && process.env.SALT_ROUNDS !== '10')) {
  console.warn(
    `SALT_ROUNDS não é um número válido no .env ("${process.env.SALT_ROUNDS}") ou não foi definido. Usando valor padrão: 10.`,
  );
}

async function main() {
  console.log(`Start seeding with SALT_ROUNDS: ${SALT_ROUNDS} ...`);

  // --- Criar Usuários com Roles ---
  const hashedPasswordUser1 = await bcrypt.hash('password123', SALT_ROUNDS);
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {
      name: 'Alice Wonderland',
      password: hashedPasswordUser1,
      role: UserRole.CUSTOMER,
    },
    create: {
      email: 'alice@example.com',
      name: 'Alice Wonderland',
      password: hashedPasswordUser1,
      role: UserRole.CUSTOMER,
    },
  });

  const hashedPasswordUser2 = await bcrypt.hash('password456', SALT_ROUNDS);
  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {
      name: 'Bob The Builder',
      password: hashedPasswordUser2,
      role: UserRole.CUSTOMER,
    },
    create: {
      email: 'bob@example.com',
      name: 'Bob The Builder',
      password: hashedPasswordUser2,
      role: UserRole.CUSTOMER,
    },
  });

  const hashedPasswordUser3 = await bcrypt.hash('password789', SALT_ROUNDS);
  const user3 = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {
      name: 'Charlie Brown',
      password: hashedPasswordUser3,
      role: UserRole.CUSTOMER,
    },
    create: {
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      password: hashedPasswordUser3,
      role: UserRole.CUSTOMER,
    },
  });

  // Criando um usuário Administrador
  const hashedPasswordAdmin = await bcrypt.hash('adminPass123!', SALT_ROUNDS);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Administrador do Sistema',
      password: hashedPasswordAdmin,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@example.com',
      name: 'Administrador do Sistema',
      password: hashedPasswordAdmin,
      role: UserRole.ADMIN,
    },
  });

  console.log(
    `Created/Updated users: ${user1.name} (CUSTOMER), ${user2.name} (CUSTOMER), ${user3.name} (CUSTOMER), ${adminUser.name} (ADMIN)`,
  );

  // --- Limpeza e Criação de Produtos  ---
  await prisma.product.deleteMany({});
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
  const product4 = await prisma.product.create({
    data: {
      title: 'Fone de Ouvido Bluetooth WaveSound',
      description: 'Som imersivo e cancelamento de ruído.',
      price: 199.0,
      category: 'Eletrônicos',
    },
  });
  console.log(
    `Created products: ${product1.title}, ${product2.title}, ${product3.title}, ${product4.title}`,
  );

  // --- Limpeza e Criação de Favoritos  ---
  await prisma.favorite.deleteMany({});
  const favoritesToCreate = [
    { userId: user1.id, productId: product1.id },
    { userId: user1.id, productId: product3.id },
    { userId: user2.id, productId: product2.id },
    { userId: user3.id, productId: product4.id },
    { userId: adminUser.id, productId: product1.id },
  ];
  for (const favData of favoritesToCreate) {
    try {
      await prisma.favorite.create({ data: favData });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        console.log(
          `Favorite for user ${favData.userId} product ${favData.productId} already exists.`,
        );
      } else {
        throw e;
      }
    }
  }
  console.log(`Created favorites.`);

  // --- Limpeza e Criação de Carrinhos e Itens ---
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});

  const cartAlice = await prisma.cart.create({ data: { userId: user1.id } });
  await prisma.cartItem.createMany({
    data: [
      { cartId: cartAlice.id, productId: product1.id, quantity: 1 },
      { cartId: cartAlice.id, productId: product4.id, quantity: 1 },
    ],
  });
  console.log(`Created cart with items for ${user1.name}.`);

  const cartCharlie = await prisma.cart.create({ data: { userId: user3.id } });
  await prisma.cartItem.createMany({
    data: [{ cartId: cartCharlie.id, productId: product2.id, quantity: 1 }],
  });
  console.log(`Created cart with items for ${user3.name}.`);

  // --- Limpeza e Criação de Pedidos e Itens ---
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  // Pedido 1: Bob (PENDING)
  const orderBobPending = await prisma.order.create({
    data: {
      userId: user2.id,
      status: OrderStatus.PENDING,
      totalAmount: product2.price * 1 + product3.price * 1,
      items: {
        createMany: {
          data: [
            { productId: product2.id, quantity: 1, priceAtPurchase: product2.price },
            { productId: product3.id, quantity: 1, priceAtPurchase: product3.price },
          ],
        },
      },
    },
  });
  console.log(`Created PENDING order for ${user2.name} with total ${orderBobPending.totalAmount}.`);

  // Pedido 2: Alice compra e recebe o Laptop
  const orderAliceDelivered = await prisma.order.create({
    data: {
      userId: user1.id,
      status: OrderStatus.DELIVERED,
      totalAmount: product1.price * 1,
      items: { create: [{ productId: product1.id, quantity: 1, priceAtPurchase: product1.price }] },
    },
  });
  console.log(`Created DELIVERED order for ${user1.name} (Laptop).`);

  // Pedido 3: Charlie compra e recebe a Cafeteira e o Livro
  const orderCharlieDelivered = await prisma.order.create({
    data: {
      userId: user3.id,
      status: OrderStatus.DELIVERED,
      totalAmount: product2.price * 1 + product3.price * 1,
      items: {
        createMany: {
          data: [
            { productId: product2.id, quantity: 1, priceAtPurchase: product2.price },
            { productId: product3.id, quantity: 1, priceAtPurchase: product3.price },
          ],
        },
      },
    },
  });
  console.log(`Created DELIVERED order for ${user3.name} (Cafeteira, Livro).`);

  // Pedido 4: Admin compra e recebe o Fone
  const orderAdminDelivered = await prisma.order.create({
    data: {
      userId: adminUser.id,
      status: OrderStatus.DELIVERED,
      totalAmount: product4.price * 1,
      items: { create: [{ productId: product4.id, quantity: 1, priceAtPurchase: product4.price }] },
    },
  });
  console.log(`Created DELIVERED order for ${adminUser.name} (Fone).`);

  // --- Limpeza e Criação de Avaliações ---
  await prisma.review.deleteMany({});

  await prisma.review.upsert({
    where: { userId_productId: { userId: user1.id, productId: product1.id } },
    update: { rating: 5, comment: 'Adorei o laptop, super rápido! (atualizado)' },
    create: {
      userId: user1.id,
      productId: product1.id,
      rating: 5,
      comment: 'Adorei o laptop, super rápido!',
    },
  });
  console.log(`${user1.name} reviewed ${product1.title}.`);

  await prisma.review.upsert({
    where: { userId_productId: { userId: user3.id, productId: product2.id } },
    update: { rating: 4, comment: 'Faz um bom café. (atualizado)' },
    create: { userId: user3.id, productId: product2.id, rating: 4, comment: 'Faz um bom café.' },
  });
  console.log(`${user3.name} reviewed ${product2.title}.`);

  await prisma.review.upsert({
    where: { userId_productId: { userId: user3.id, productId: product3.id } },
    update: { rating: 5, comment: 'Leitura essencial! (atualizado)' },
    create: { userId: user3.id, productId: product3.id, rating: 5, comment: 'Leitura essencial!' },
  });
  console.log(`${user3.name} reviewed ${product3.title}.`);

  await prisma.review.upsert({
    where: { userId_productId: { userId: adminUser.id, productId: product4.id } },
    update: { rating: 5, comment: 'Qualidade de som incrível! (atualizado)' },
    create: {
      userId: adminUser.id,
      productId: product4.id,
      rating: 5,
      comment: 'Qualidade de som incrível!',
    },
  });
  console.log(`${adminUser.name} reviewed ${product4.title}.`);

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
