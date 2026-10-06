import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TablesService } from './tables.service.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('TablesService', () => {
  let service: TablesService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      table: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };
    service = new TablesService(prismaMock);
  });

  it('deve listar todas as mesas ordenadas por número', async () => {
    const mockTables = [
      { id: 1, number: 1, capacity: 4, status: 'AVAILABLE' },
      { id: 2, number: 2, capacity: 2, status: 'AVAILABLE' },
    ];
    prismaMock.table.findMany.mockResolvedValue(mockTables);

    const result = await service.findAll();
    expect(result).toEqual(mockTables);
    expect(prismaMock.table.findMany).toHaveBeenCalledWith({
      orderBy: { number: 'asc' },
    });
  });

  it('deve lançar erro ao tentar cadastrar mesa com número já existente', async () => {
    prismaMock.table.findUnique.mockResolvedValue({ id: 1, number: 1 });

    await expect(service.create({ number: 1, capacity: 4 })).rejects.toThrow(
      ConflictException,
    );
  });

  it('deve lançar erro ao buscar mesa inexistente', async () => {
    prismaMock.table.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
