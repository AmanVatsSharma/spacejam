const fs = require('fs');
const p = process.argv[2];
let s = fs.readFileSync(p, 'utf8');
const oldImport = "import { NotFoundException, UnauthorizedException } from '@nestjs/common';";
const newImport = "import { UseGuards, NotFoundException, UnauthorizedException } from '@nestjs/common';";
if (s.includes(oldImport)) {
  s = s.replace(oldImport, newImport);
  fs.writeFileSync(p, s);
  console.log('fixed center.resolver.ts');
} else {
  console.log('already fixed or pattern not found');
}
