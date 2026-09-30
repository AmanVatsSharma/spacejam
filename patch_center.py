#!/usr/bin/env python3
"""Patch center.resolver.ts with CENTER_MANAGER ownership scoping."""
import re

path = '/home/ubuntu/spacejam/apps/api/src/graphql/resolvers/center.resolver.ts'
with open(path) as f:
    src = f.read()

# Add import
src = src.replace(
    "import { UserRole as UR } from '../../auth/roles.enum';",
    "import { UserRole as UR } from '../../auth/roles.enum';\n"
    "import { assertCenterOwnership } from '../../auth/helpers/center-scope.helper';\n"
)

# Inject centerRepo into SeatResolver constructor
src = src.replace(
    "    @InjectRepository(SeatEntity)\n"
    "    private seatRepo: Repository<SeatEntity>,\n"
    "    private readonly pubSub: PubSubService,",
    "    @InjectRepository(SeatEntity)\n"
    "    private seatRepo: Repository<SeatEntity>,\n"
    "    @InjectRepository(CenterEntity)\n"
    "    private centerRepo: Repository<CenterEntity>,\n"
    "    private readonly pubSub: PubSubService,"
)

# updateCenter
src = src.replace(
    "  async updateCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateCenterInput,\n"
    "    @Context() context\n"
    "  ): Promise<CenterEntity> {\n"
    "    await this.centerRepo.update(id, input);",
    "  async updateCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateCenterInput,\n"
    "    @Context() context\n"
    "  ): Promise<CenterEntity> {\n"
    "    const center = await this.centerRepo.findOne({ where: { id } });\n"
    "    if (!center) throw new NotFoundException('Center not found');\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    await this.centerRepo.update(id, input);"
)

# deleteCenter
src = src.replace(
    "  async deleteCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Context() context\n"
    "  ): Promise<boolean> {\n"
    "\n"
    "    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });",
    "  async deleteCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Context() context\n"
    "  ): Promise<boolean> {\n"
    "    const center = await this.centerRepo.findOne({ where: { id } });\n"
    "    if (!center) throw new NotFoundException('Center not found');\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "\n"
    "    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });"
)

# createFloor
src = src.replace(
    "  async createFloor(\n"
    "    @Args('input') input: CreateFloorInput\n"
    "  ): Promise<FloorEntity> {\n"
    "    const newFloor = this.floorRepo.create(input);\n"
    "    const floor = await this.floorRepo.save(newFloor);",
    "  async createFloor(\n"
    "    @Args('input') input: CreateFloorInput,\n"
    "    @Context() context\n"
    "  ): Promise<FloorEntity> {\n"
    "    const center = await this.centerRepo.findOne({ where: { id: input.centerId } });\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    const newFloor = this.floorRepo.create(input);\n"
    "    const floor = await this.floorRepo.save(newFloor);"
)

# updateFloor
src = src.replace(
    "  async updateFloor(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateFloorInput\n"
    "  ): Promise<FloorEntity> {\n"
    "    await this.floorRepo.update(id, input);\n"
    "    const floor = await this.floorRepo.findOne({ where: { id }, relations: ['seats'] });",
    "  async updateFloor(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateFloorInput,\n"
    "    @Context() context\n"
    "  ): Promise<FloorEntity> {\n"
    "    const existing = await this.floorRepo.findOne({ where: { id }, select: ['centerId'] as any });\n"
    "    const center = existing ? await this.centerRepo.findOne({ where: { id: existing.centerId } }) : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    await this.floorRepo.update(id, input);\n"
    "    const floor = await this.floorRepo.findOne({ where: { id }, relations: ['seats'] });"
)

# deleteFloor
src = src.replace(
    "  async deleteFloor(\n"
    "    @Args('id', { type: () => ID }) id: string\n"
    "  ): Promise<boolean> {\n"
    "    const floor = await this.floorRepo.findOne({ where: { id } });",
    "  async deleteFloor(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Context() context\n"
    "  ): Promise<boolean> {\n"
    "    const existing = await this.floorRepo.findOne({ where: { id }, select: ['centerId'] as any });\n"
    "    const center = existing ? await this.centerRepo.findOne({ where: { id: existing.centerId } }) : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    const floor = await this.floorRepo.findOne({ where: { id } });"
)

# createSeat
src = src.replace(
    "  async createSeat(@Args('input') input: CreateSeatInput): Promise<SeatEntity> {\n"
    "    const newSeat = this.seatRepo.create(input);",
    "  async createSeat(@Args('input') input: CreateSeatInput, @Context() context): Promise<SeatEntity> {\n"
    "    const floor = await this.floorRepo.findOne({ where: { id: input.floorId }, select: ['centerId'] as any });\n"
    "    const center = floor ? await this.centerRepo.findOne({ where: { id: floor.centerId } }) : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    const newSeat = this.seatRepo.create(input);"
)

# updateSeat
src = src.replace(
    "  async updateSeat(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateSeatInput\n"
    "  ): Promise<SeatEntity> {\n"
    "    await this.seatRepo.update(id, input);\n"
    "    const seat = await this.seatRepo.findOne({ where: { id }, relations: ['floor'] });",
    "  async updateSeat(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateSeatInput,\n"
    "    @Context() context\n"
    "  ): Promise<SeatEntity> {\n"
    "    const existing = await this.seatRepo.findOne({ where: { id }, relations: ['floor'] });\n"
    "    const center = existing?.floor\n"
    "      ? await this.centerRepo.findOne({ where: { id: existing.floor.centerId } })\n"
    "      : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    await this.seatRepo.update(id, input);\n"
    "    const seat = await this.seatRepo.findOne({ where: { id }, relations: ['floor'] });"
)

# deleteSeat
src = src.replace(
    "  async deleteSeat(\n"
    "    @Args('id', { type: () => ID }) id: string\n"
    "  ): Promise<boolean> {\n"
    "    const seat = await this.seatRepo.findOne({ where: { id }, relations: ['floor'] });",
    "  async deleteSeat(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Context() context\n"
    "  ): Promise<boolean> {\n"
    "    const existing = await this.seatRepo.findOne({ where: { id }, relations: ['floor'] });\n"
    "    const center = existing?.floor\n"
    "      ? await this.centerRepo.findOne({ where: { id: existing.floor.centerId } })\n"
    "      : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    const seat = await this.seatRepo.findOne({ where: { id }, relations: ['floor'] });"
)

with open(path, 'w') as f:
    f.write(src)

print('Patched center.resolver.ts')
