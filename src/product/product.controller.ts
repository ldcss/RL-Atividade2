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
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { Product } from './entities/product.entity';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from 'src/user/type/UserRole';
import { AuthenticatedUserPayload } from 'src/auth/type/authenticated-user.payload';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Criar um novo produto (Apenas Admin)' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Produto criado com sucesso.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado. Recurso para administradores.',
  })
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = await this.productService.create(createProductDto);
    return newProduct;
  }

  @Get()
  @ApiResponse({ status: HttpStatus.OK })
  @ApiOperation({ summary: 'Listar todos os produtos' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de produtos.', type: [Product] })
  async findAll(): Promise<Product[]> {
    const products = await this.productService.findAll();
    return products;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK })
  @ApiOperation({ summary: 'Buscar um produto pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do Produto (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Produto encontrado.', type: Product })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto não encontrado.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    const product = await this.productService.findOne(id);
    return product;
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar um produto pelo ID (Apenas Admin)' })
  @ApiParam({ name: 'id', description: 'ID do Produto (UUID)', type: String })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Produto atualizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto não encontrado.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado. Recurso para administradores.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<Product> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem atualizar produtos.');
    }
    const updatedProduct = await this.productService.update(id, updateProductDto);
    return updatedProduct;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar um produto pelo ID (Apenas Admin)' })
  @ApiParam({ name: 'id', description: 'ID do Produto (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Produto deletado com sucesso.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Produto não encontrado.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado. Recurso para administradores.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflito ao deletar (ex: produto em um pedido).',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: AuthenticatedUserPayload },
  ): Promise<void> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem deletar produtos.');
    }
    await this.productService.remove(id);
  }
}
