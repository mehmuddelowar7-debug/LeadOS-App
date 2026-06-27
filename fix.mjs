import fs from 'fs';
const file = 'src/features/contacts/ContactEntryView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/navigate\(ROUTES\.CONTACT_DETAILS\)/g, 'navigate(`/contacts/${duplicateContact.id}`)');
content = content.replace(/navigate\(`\/contacts\/\${contactId}`\)/g, 'navigate(ROUTES.CONTACTS)');
// Also fix navigate('/contacts/new?mode=') if it was broken
content = content.replace(/navigate\(ROUTES\.CONTACTS_NEW\?mode=\${tab\.key}/g, 'navigate(`/contacts/new?mode=${tab.key}`');

fs.writeFileSync(file, content);
console.log('Fixed ContactEntryView');
