#!/usr/bin/env python3
"""Fix assertCenterOwnership variable name mismatches in center.resolver.ts."""
path = '/home/ubuntu/spacejam/apps/api/src/graphql/resolvers/center.resolver.ts'
with open(path) as f:
    src = f.read()

# In FloorResolver/SeatResolver, the variable is `center`, not `existingCenter`.
# Replace all assertion calls that wrongly reference `existingCenter` with `center`.
# The CenterResolver methods (updateCenter, deleteCenter) correctly use `existingCenter`,
# so we need to be precise. The FloorResolver/SeatResolver methods declare `const center = ...`
# immediately before the assert call.

# Strategy: find each "assertCenterOwnership(existingCenter, ...)" and check
# if the surrounding scope uses `center` or `existingCenter`.
# In FloorResolver and SeatResolver, the pattern is always:
#   const center = await this.centerRepo.findOne(...);
#   assertCenterOwnership(existingCenter, ...);
# We replace assertCenterOwnership(existingCenter -> assertCenterOwnership(center
# only within FloorResolver and SeatResolver.

# Split by resolver class boundaries
parts = src.split('@Resolver(() => FloorEntity)')
if len(parts) == 2:
    before_floor = parts[0]
    rest = parts[1]
else:
    before_floor = src
    rest = ''

# Split rest into FloorResolver and SeatResolver parts
parts2 = rest.split('@Resolver(() => SeatEntity)')
if len(parts2) == 2:
    floor_part = parts2[0]
    seat_part = parts2[1]
else:
    floor_part = rest
    seat_part = ''

# In FloorResolver and SeatResolver, replace assertCenterOwnership(existingCenter -> assertCenterOwnership(center
floor_part = floor_part.replace(
    'assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role)',
    'assertCenterOwnership(center, context.req.user.id, context.req.user.role)'
)
seat_part = seat_part.replace(
    'assertCenterOwnership(existingCenter, context.req.user.id, context.req.user.role)',
    'assertCenterOwnership(center, context.req.user.id, context.req.user.role)'
)

# Reassemble
src = before_floor + '@Resolver(() => FloorEntity)' + floor_part + '@Resolver(() => SeatEntity)' + seat_part

with open(path, 'w') as f:
    f.write(src)

print('Fixed variable name mismatches in FloorResolver and SeatResolver')
