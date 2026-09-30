#!/usr/bin/env python3
"""Clean up duplicate center/ownership checks in center.resolver.ts."""
path = '/home/ubuntu/spacejam/apps/api/src/graphql/resolvers/center.resolver.ts'
with open(path) as f:
    src = f.read()

# Fix updateCenter - collapse duplicate checks
src = src.replace(
    "  async updateCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateCenterInput,\n"
    "    @Context() context\n"
    "  ): Promise<CenterEntity> {\n"
    "    const existingCenter = await this.centerRepo.findOne({ where: { id } });\n"
    "    if (existingCenter) assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role); else throw new NotFoundException('Center not found');\n"
    "    assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role);\n"
    "    await this.centerRepo.update(id, input);\n"
    "    const center = await this.centerRepo.findOne({\n"
    "      where: { id },\n"
    "      relations: ['location'],\n"
    "    });\n"
    "    if (existingCenter) assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role); else throw new NotFoundException('Center not found');\n"
    "    await this.cache.invalidatePattern(`center:${id}`);\n"
    "    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, { centerUpdated: center });\n"
    "    return center;\n"
    "  }",
    "  async updateCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Args('input') input: UpdateCenterInput,\n"
    "    @Context() context\n"
    "  ): Promise<CenterEntity> {\n"
    "    const existingCenter = await this.centerRepo.findOne({ where: { id } });\n"
    "    if (!existingCenter) throw new NotFoundException('Center not found');\n"
    "    assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role);\n"
    "    await this.centerRepo.update(id, input);\n"
    "    const center = await this.centerRepo.findOne({\n"
    "      where: { id },\n"
    "      relations: ['location'],\n"
    "    });\n"
    "    if (!center) throw new NotFoundException('Center not found');\n"
    "    await this.cache.invalidatePattern(`center:${id}`);\n"
    "    await this.pubSub.publish(CENTER_TRIGGERS.centerUpdated, { centerUpdated: center });\n"
    "    return center;\n"
    "  }"
)

# Fix deleteCenter - collapse duplicate checks
src = src.replace(
    "  async deleteCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Context() context\n"
    "  ): Promise<boolean> {\n"
    "    const existingCenter = await this.centerRepo.findOne({ where: { id } });\n"
    "    if (existingCenter) assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role); else throw new NotFoundException('Center not found');\n"
    "    assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role);\n"
    "\n"
    "    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });\n"
    "    await this.cache.invalidatePattern(`center:${id}`);\n"
    "    return true;\n"
    "  }",
    "  async deleteCenter(\n"
    "    @Args('id', { type: () => ID }) id: string,\n"
    "    @Context() context\n"
    "  ): Promise<boolean> {\n"
    "    const existingCenter = await this.centerRepo.findOne({ where: { id } });\n"
    "    if (!existingCenter) throw new NotFoundException('Center not found');\n"
    "    assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role);\n"
    "\n"
    "    await this.centerRepo.update(id, { status: CenterStatus.MAINTENANCE });\n"
    "    await this.cache.invalidatePattern(`center:${id}`);\n"
    "    return true;\n"
    "  }"
)

with open(path, 'w') as f:
    f.write(src)

print('Cleaned up duplicate checks')
