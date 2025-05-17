import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { PackService } from './pack.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

@Controller('packs')
export class PackController {
  constructor(private readonly packService: PackService) {}

  @Post()
  async create(@Body() createPackDto: CreatePackDto) {
    return this.packService.create(createPackDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.packService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePackDto: UpdatePackDto,
  ) {
    return this.packService.update(id, updatePackDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.packService.remove(id);
  }

  @Get()
  findAll() {
    return this.packService.findAll();
  }
}
