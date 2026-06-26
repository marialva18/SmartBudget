import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/authenticated-user';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCategoriesDto,
  ) {
    return this.categoriesService.findAll(user.userId, query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.userId, user.platform, dto);
  }

  @Patch(':categoryId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(
      user.userId,
      categoryId,
      user.platform,
      dto,
    );
  }

  @Patch(':categoryId/archive')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.categoriesService.archive(
      user.userId,
      categoryId,
      user.platform,
    );
  }
}
