
import fs from 'fs';
import path from 'path';

const files = [
  "src/pages/Auth.tsx",
  "src/pages/Index.tsx"
];

const basePath = "c:\\Users\\rayap\\OneDrive\\Desktop\\organicsmm-main\\organicsmm-main";

files.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace Theme Colors
    content = content.replace(/#9b87f5/g, '#0ea5e9'); // Purple to Cyan
    content = content.replace(/#d946ef/g, '#2563eb'); // Pink to Blue
    content = content.replace(/#0a0a0c/g, '#04060c'); // Near black to Deep space blue
    content = content.replace(/#121216/g, '#0a0f1c'); // Card background deeper
    
    // Replace Logo Images
    content = content.replace(/<img src="\/favicon\.png"[^>]+>/g, '<Zap className="w-10 h-10 text-[#0ea5e9] drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated theme in ${file}`);
  }
});
