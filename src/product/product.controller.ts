import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateProductDto })
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = await this.productService.create(createProductDto);
    return newProduct;
  }

  @Get()
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(): Promise<Product[]> {
    const products = await this.productService.findAll();
    return products;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    const product = await this.productService.findOne(id);
    return product;
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const updatedProduct = await this.productService.update(id, updateProductDto);
    return updatedProduct;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.productService.remove(id);
  }
}
