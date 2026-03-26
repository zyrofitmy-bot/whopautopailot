
import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  "index.html",
  "src/components/seo/PageMeta.tsx",
  "src/components/layout/Sidebar.tsx",
  "src/components/layout/MobileBottomNav.tsx",
  "src/pages/Auth.tsx",
  "src/pages/Index.tsx",
  "README.md",
  "public/sw.js",
  "src/pages/legal/TermsOfService.tsx",
  "src/pages/legal/PrivacyPolicy.tsx",
  "src/pages/legal/RefundPolicy.tsx",
  "src/pages/legal/CookiePolicy.tsx"
];

const basePath = "c:\\Users\\rayap\\OneDrive\\Desktop\\organicsmm-main\\organicsmm-main";

filesToUpdate.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix the exact spelling based on user feedback
    content = content.replace(/Whopautopilot 2\.0/g, "Whopautopailot");
    content = content.replace(/Whopautopilot/g, "Whopautopailot");
    content = content.replace(/whopautopilot/g, "whopautopailot");
    content = content.replace(/WHOPAUTOPILOT 2\.0/g, "WHOPAUTOPAILOT");
    content = content.replace(/WHOPAUTOPILOT/g, "WHOPAUTOPAILOT");
    
    // SEO Meta updates
    content = content.replace(/OrganicSMM/g, "Whopautopailot");
    content = content.replace(/organicsmm/g, "whopautopailot");
    content = content.replace(/Grow Your Social Media The Natural Way/g, "Smart Automation Console");
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated spelling and SEO in ${file}`);
  }
});
