#!/usr/bin/env python3
"""Patch meeting-room.resolver.ts with CENTER_MANAGER ownership scoping."""
path = '/home/ubuntu/spacejam/apps/api/src/graphql/resolvers/meeting-room.resolver.ts'
with open(path) as f:
    src = f.read()

# Add import for Center entity
src = src.replace(
    "import { MeetingRoom } from '../../typeorm/entities/meeting-room.entity';",
    "import { MeetingRoom } from '../../typeorm/entities/meeting-room.entity';\n"
    "import { Center } from '../../typeorm/entities/center.entity';"
)

# Add import for assertCenterOwnership
src = src.replace(
    "import { UserRole } from '../../auth/roles.enum';",
    "import { UserRole } from '../../auth/roles.enum';\n"
    "import { assertCenterOwnership } from '../../auth/helpers/center-scope.helper';"
)

# Inject centerRepo into constructor
src = src.replace(
    "    @InjectRepository(Notification)\n"
    "    private notifRepo: Repository<Notification>,\n"
    "  ) {}",
    "    @InjectRepository(Notification)\n"
    "    private notifRepo: Repository<Notification>,\n"
    "    @InjectRepository(Center)\n"
    "    private centerRepo: Repository<Center>,\n"
    "  ) {}"
)

# createMeetingRoom - resolve center from input.centerId
src = src.replace(
    "  async createMeetingRoom(\n"
    "    @Args('input') input: CreateMeetingRoomInput,\n"
    "  ): Promise<MeetingRoom> {\n"
    "    const { pricePerHour, ...rest } = input;\n"
    "    const room = this.roomRepo.create({\n"
    "      ...rest,\n"
    "      hourlyRate: pricePerHour ?? 0,\n"
    "    });\n"
    "    const saved = await this.roomRepo.save(room);",
    "  async createMeetingRoom(\n"
    "    @Args('input') input: CreateMeetingRoomInput,\n"
    "    @Context() context\n"
    "  ): Promise<MeetingRoom> {\n"
    "    const center = await this.centerRepo.findOne({ where: { id: input.centerId } });\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    const { pricePerHour, ...rest } = input;\n"
    "    const room = this.roomRepo.create({\n"
    "      ...rest,\n"
    "      hourlyRate: pricePerHour ?? 0,\n"
    "    });\n"
    "    const saved = await this.roomRepo.save(room);"
)

# updateMeetingRoom
src = src.replace(
    "  async updateMeetingRoom(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateMeetingRoomInput,\n"
    "  ): Promise<MeetingRoom> {\n"
    "    const { pricePerHour, ...rest } = input;\n"
    "    const updatePayload: any = { ...rest };\n"
    "    if (pricePerHour !== undefined) updatePayload.hourlyRate = pricePerHour;\n"
    "\n"
    "    await this.roomRepo.update(id, updatePayload);\n"
    "    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });",
    "  async updateMeetingRoom(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateMeetingRoomInput,\n"
    "    @Context() context\n"
    "  ): Promise<MeetingRoom> {\n"
    "    const existing = await this.roomRepo.findOne({ where: { id }, select: ['centerId'] as any });\n"
    "    const center = existing ? await this.centerRepo.findOne({ where: { id: existing.centerId } }) : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    const { pricePerHour, ...rest } = input;\n"
    "    const updatePayload: any = { ...rest };\n"
    "    if (pricePerHour !== undefined) updatePayload.hourlyRate = pricePerHour;\n"
    "\n"
    "    await this.roomRepo.update(id, updatePayload);\n"
    "    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });"
)

# updateRoomStatus
src = src.replace(
    "  async updateRoomStatus(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('status', { type: () => String }) status: RoomStatus,\n"
    "  ): Promise<MeetingRoom> {\n"
    "    await this.roomRepo.update(id, { status });\n"
    "    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });",
    "  async updateRoomStatus(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('status', { type: () => String }) status: RoomStatus,\n"
    "    @Context() context\n"
    "  ): Promise<MeetingRoom> {\n"
    "    const existing = await this.roomRepo.findOne({ where: { id }, select: ['centerId'] as any });\n"
    "    const center = existing ? await this.centerRepo.findOne({ where: { id: existing.centerId } }) : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    await this.roomRepo.update(id, { status });\n"
    "    const room = await this.roomRepo.findOne({ where: { id }, relations: ['center'] });"
)

# deleteMeetingRoom
src = src.replace(
    "  async deleteMeetingRoom(@Args('id', { type: () => ID }) id: string): Promise<boolean> {\n"
    "    await this.roomRepo.delete(id);",
    "  async deleteMeetingRoom(@Args('id', { type: () => ID }) id: string, @Context() context): Promise<boolean> {\n"
    "    const existing = await this.roomRepo.findOne({ where: { id }, select: ['centerId'] as any });\n"
    "    const center = existing ? await this.centerRepo.findOne({ where: { id: existing.centerId } }) : null;\n"
    "    assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    await this.roomRepo.delete(id);"
)

# bulkUpdateStatus
src = src.replace(
    "  async bulkUpdateStatus(\n"
    "    @Args('roomIds', { type: () => [String] }) roomIds: string[],\n"
    "    @Args('status', { type: () => String }) status: RoomStatus,\n"
    "  ): Promise<boolean> {\n"
    "    if (roomIds.length === 0) return true;\n"
    "    await this.roomRepo.update({ id: In(roomIds) as any }, { status });",
    "  async bulkUpdateStatus(\n"
    "    @Args('roomIds', { type: () => [String] }) roomIds: string[],\n"
    "    @Args('status', { type: () => String }) status: RoomStatus,\n"
    "    @Context() context\n"
    "  ): Promise<boolean> {\n"
    "    if (roomIds.length === 0) return true;\n"
    "    // Verify ownership on all rooms (all rooms must belong to a center the manager owns)\n"
    "    const rooms = await this.roomRepo.find({ where: { id: In(roomIds) as any }, select: ['centerId'] as any });\n"
    "    const centerIds = [...new Set(rooms.map((r: any) => r.centerId).filter(Boolean))];\n"
    "    for (const cid of centerIds) {\n"
    "      const center = await this.centerRepo.findOne({ where: { id: cid } });\n"
    "      assertCenterOwnership(center, context.req.user.id, context.req.user.role);\n"
    "    }\n"
    "    await this.roomRepo.update({ id: In(roomIds) as any }, { status });"
)

with open(path, 'w') as f:
    f.write(src)

print('Patched meeting-room.resolver.ts')
