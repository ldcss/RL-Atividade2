import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { FavoriteModule } from './favorite/favorite.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [UserModule, ProductModule, FavoriteModule, CartModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
