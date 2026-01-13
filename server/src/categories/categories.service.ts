import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all categories for a user
   */
  async getUserCategories(userId: bigint) {
    const categories = await this.prisma.category.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    }) as any[];

    return categories.map((c) => ({
      id: Number(c.id),
      name: c.name,
      color: c.color ?? '#6b7280',
      icon: c.icon ?? 'folder',
      created_at: c.created_at.toISOString(),
    }));
  }

  /**
   * Create a new category for a user
   */
  async createCategory(userId: bigint, dto: CreateCategoryDto) {
    // Normalize the name: trim
    const normalizedName = dto.name.trim();
    
    console.log(`[CREATE CATEGORY] User ${userId} attempting to create: "${normalizedName}"`);
    console.log(`[CREATE CATEGORY] DTO received:`, JSON.stringify(dto));
    
    try {
      // Get all existing categories for case-insensitive check
      const allCategories = await this.prisma.category.findMany({
        where: {
          user_id: userId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      console.log(`[CREATE CATEGORY] Existing categories:`, allCategories.length);

      // Check for duplicate (case-insensitive)
      const duplicate = allCategories.find(
        cat => cat.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (duplicate) {
        console.log(`[CREATE CATEGORY] Duplicate found: "${duplicate.name}" (ID: ${duplicate.id})`);
        throw new ConflictException(`Category "${normalizedName}" already exists`);
      }

      console.log(`[CREATE CATEGORY] About to create with data:`, {
        user_id: userId.toString(),
        name: normalizedName,
        color: dto.color ?? '#6b7280',
        icon: dto.icon ?? 'folder',
      });

      const category = await this.prisma.category.create({
        data: {
          user_id: userId,
          name: normalizedName,
          color: dto.color ?? '#6b7280',
          icon: dto.icon ?? 'folder',
        } as any,
      }) as any;

      console.log(`[CREATE CATEGORY] Successfully created: "${category.name}" (ID: ${category.id})`);

      return {
        id: Number(category.id),
        name: category.name,
        color: category.color ?? '#6b7280',
        icon: category.icon ?? 'folder',
        created_at: category.created_at.toISOString(),
      };
    } catch (error: any) {
      console.error(`[CREATE CATEGORY] Error:`, error.message);
      console.error(`[CREATE CATEGORY] Full error:`, error);
      throw error;
    }
  }

  /**
   * Delete a category (only if it has no tasks)
   */
  async deleteCategory(userId: bigint, categoryId: bigint) {
    // Check if category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        user_id: userId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has tasks
    const taskCount = await this.prisma.task.count({
      where: { category_id: categoryId },
    });

    if (taskCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing tasks. Please move or delete the tasks first.',
      );
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  }

  /**
   * Ensure user has a "Home" category (called during registration or first login)
   */
  async ensureDefaultCategory(userId: bigint) {
    const homeCategory = await this.prisma.category.findFirst({
      where: {
        user_id: userId,
        name: 'Home',
      },
    });

    if (!homeCategory) {
      await this.prisma.category.create({
        data: {
          user_id: userId,
          name: 'Home',
        },
      });
    }
  }
}
