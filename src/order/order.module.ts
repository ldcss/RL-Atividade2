import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';
import { CartModule } from 'src/cart/cart.module';
import { PrismaService } from 'prisma/prisma.service';
import { CartService } from 'src/cart/cart.service';

@Module({
  imports: [UserModule, ProductModule, CartModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService, CartService],
})
export class OrderModule {}
