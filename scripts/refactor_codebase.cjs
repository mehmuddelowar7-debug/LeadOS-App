const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(process.cwd(), 'src'), function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/Candidate/g, 'Opportunity');
    content = content.replace(/candidate/g, 'opportunity');
    content = content.replace(/CANDIDATE/g, 'OPPORTUNITY');

    content = content.replace(/Campaign/g, 'OpportunityType');
    content = content.replace(/campaign/g, 'opportunity_type');
    content = content.replace(/CAMPAIGN/g, 'OPPORTUNITY_TYPE');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
    }
  }
});
console.log('Codebase refactored');
