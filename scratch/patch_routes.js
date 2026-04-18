import fs from 'fs';
let content = fs.readFileSync('backend/src/api/routes.js', 'utf8');

// Add settings routes before the last export or end of file
const newRoutes = `

// SETTINGS
router.get('/settings', (req, res) => {
   const modelRow = db.prepare("SELECT value FROM settings WHERE key = 'model'").get();
   res.json({ model: modelRow ? modelRow.value : 'qwen2.5:0.5b' });
});

router.post('/settings', (req, res) => {
   const { model } = req.body;
   if (model) {
      db.prepare("INSERT INTO settings (key, value) VALUES ('model', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(model);
   }
   res.json({ success: true });
});
`;

if (!content.includes('/settings')) {
  // insert before export default router;
  content = content.replace('export default router;', newRoutes + '\nexport default router;');
  fs.writeFileSync('backend/src/api/routes.js', content);
}
