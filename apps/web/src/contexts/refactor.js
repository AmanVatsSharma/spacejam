const fs = require('fs');
let c = fs.readFileSync('apps/web/src/contexts/auth-context.tsx', 'utf8');
c = c.replace(/import React from 'react';/, "import { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';");
c = c.replace(/React\./g, '');
fs.writeFileSync('apps/web/src/contexts/auth-context.tsx', c);
