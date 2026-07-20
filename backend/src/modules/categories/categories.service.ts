import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isPrismaNotFoundError,
  isPrismaUniqueError,
} from '../../common/utils/prisma-error';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CategoryNode[];
}

export interface FlatCategory {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

@Injectable()
export class CategoriesService {
  private readonly cacheKeyTree = 'categories:tree';
  private readonly cacheKeyFlat = 'categories:flat';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(): Promise<FlatCategory[]> {
    return this.findFlat();
  }

  async findFlat(): Promise<FlatCategory[]> {
    const cached = await this.cacheService.get<FlatCategory[]>(this.cacheKeyFlat);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const flatCategories: FlatCategory[] = [];

    // Helper function to build paths
    const getPath = (cat: any): string => {
      const parts: string[] = [cat.name];
      let current = cat;
      while (current.parentId) {
        const parent = categories.find((c) => c.id === current.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        current = parent;
      }
      return parts.join(' > ');
    };

    for (const cat of categories) {
      flatCategories.push({
        id: cat.id,
        name: getPath(cat),
        parentId: cat.parentId,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      });
    }

    await this.cacheService.set(this.cacheKeyFlat, flatCategories);
    return flatCategories;
  }

  async findTree(): Promise<CategoryNode[]> {
    const cached = await this.cacheService.get<CategoryNode[]>(this.cacheKeyTree);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Initialize map
    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        children: [],
      });
    }

    // Connect hierarchy
    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId) {
        const parentNode = map.get(cat.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // If parent is deleted or doesn't exist, treat as root
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    await this.cacheService.set(this.cacheKeyTree, roots);
    return roots;
  }

  async isDescendantOf(categoryId: string, potentialParentId: string): Promise<boolean> {
    if (!potentialParentId) return false;
    let currentId = potentialParentId;
    while (currentId) {
      if (currentId === categoryId) return true;
      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      if (!category || !category.parentId) break;
      currentId = category.parentId;
    }
    return false;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundException('Kategori induk tidak ditemukan');
      }
      if (!parent.isActive) {
        throw new BadRequestException('Kategori induk yang dipilih tidak aktif');
      }
    }

    try {
      const category = await this.prisma.category.create({ data: dto });
      await this.invalidateCache();
      return category;
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nama kategori sudah digunakan pada level ini');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Kategori tidak boleh menjadi parent dari dirinya sendiri');
      }
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundException('Kategori induk tidak ditemukan');
      }
      if (!parent.isActive) {
        throw new BadRequestException('Kategori induk yang dipilih tidak aktif');
      }
      const isDescendant = await this.isDescendantOf(id, dto.parentId);
      if (isDescendant) {
        throw new BadRequestException('Kategori tidak boleh menjadi child dari subkategorinya sendiri');
      }
    }

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: dto,
      });
      await this.invalidateCache();
      return category;
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }
      if (isPrismaUniqueError(error)) {
        throw new BadRequestException('Nama kategori sudah digunakan pada level ini');
      }
      throw error;
    }
  }

  async deactivate(id: string) {
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });
      await this.invalidateCache();
      return category;
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }
      throw error;
    }
  }

  async remove(id: string) {
    // Check if category has products (any, not just active)
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (productsCount > 0) {
      throw new BadRequestException('Kategori tidak dapat dihapus karena masih digunakan oleh produk');
    }

    // Check if category has child categories
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childrenCount > 0) {
      throw new BadRequestException('Kategori tidak dapat dihapus karena masih memiliki subkategori');
    }

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });
      await this.invalidateCache();
      return category;
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }
      throw error;
    }
  }

  private async invalidateCache() {
    await this.cacheService.del(this.cacheKeyTree);
    await this.cacheService.del(this.cacheKeyFlat);
    await this.cacheService.del('categories:all');
  }
}
