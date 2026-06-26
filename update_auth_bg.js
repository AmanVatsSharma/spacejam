const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/app/(auth)/forgot-password/ForgotPasswordClient.tsx',
  'apps/web/src/app/(auth)/magic-link/MagicLinkClient.tsx',
  'apps/web/src/app/(auth)/reset-password/ResetPasswordClient.tsx',
  'apps/web/src/app/(auth)/signin/magic-link/MagicLinkRequestClient.tsx',
  'apps/web/src/app/(auth)/signin/page.tsx',
  'apps/web/src/app/(auth)/signup/page.tsx',
  'apps/web/src/app/(auth)/verify-email/VerifyEmailClient.tsx'
];

files.forEach(f => {
  const absolutePath = path.join('c:/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam', f);
  let content = fs.readFileSync(absolutePath, 'utf8');

  // 1. Add AuthBackground import just below the styles import
  if (!content.includes('AuthBackground')) {
    content = content.replace(
      /(import styles from ".*?auth\.module\.css";)/,
      '$1\nimport { AuthBackground } from "@/components/auth/auth-background";'
    );
  }

  // 2. Replace the Left Side HTML with the new component
  content = content.replace(
    /\{\/\* Left Side - Decorative \*\/\}[\s\S]*?\{\/\* Right Side - Form \*\/\}/,
    '<AuthBackground />\n\n      {/* Right Side - Form */}'
  );

  fs.writeFileSync(absolutePath, content);
  console.log(`Updated ${f}`);
});
