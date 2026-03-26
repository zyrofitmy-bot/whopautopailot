
import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "index.html",
  "README.md",
  "src/components/seo/PageMeta.tsx",
  "public/sw.js",
  "src/pages/Auth.tsx",
  "public/robots.txt",
  "src/components/wallet/RazorpayDepositCard.tsx",
  "src/hooks/useServices.ts",
  "src/components/layout/MobileBottomNav.tsx",
  "src/components/layout/Sidebar.tsx",
  "src/pages/Index.tsx",
  "src/pages/legal/CookiePolicy.tsx",
  "src/pages/legal/PrivacyPolicy.tsx",
  "src/pages/legal/RefundPolicy.tsx",
  "src/pages/legal/TermsOfService.tsx"
];

const basePath = "c:\\Users\\rayap\\OneDrive\\Desktop\\organicsmm-main\\organicsmm-main";

filesToUpdate.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replacements
    content = content.replace(/OrganicSMM/g, "Whopautopilot 2.0");
    content = content.replace(/organicsmm/g, "whopautopilot");
    content = content.replace(/ORGANICSMM/g, "WHOPAUTOPILOT 2.0");
    content = content.replace(/Organic SMM/g, "Whopautopilot 2.0");
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log("Rebranding text replacement complete.");
