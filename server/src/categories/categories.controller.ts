import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async getUserCategories(@Request() req: any) {
    const userId = BigInt(req.user.sub);
    return this.categoriesService.getUserCategories(userId);
  }

  @Post()
  async createCategory(@Request() req: any, @Body() dto: CreateCategoryDto) {
    const userId = BigInt(req.user.sub);
    return this.categoriesService.createCategory(userId, dto);
  }

  @Delete(':id')
  async deleteCategory(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = BigInt(req.user.sub);
    return this.categoriesService.deleteCategory(userId, BigInt(id));
  }
}
