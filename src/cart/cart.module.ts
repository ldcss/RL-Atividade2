import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { UserModule } from 'src/user/user.module';
import { PrismaService } from 'prisma/prisma.service';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [UserModule, ProductModule],
  controllers: [CartController],
  providers: [CartService, PrismaService],
})
export class CartModule {}
