const fs = require("fs");
const fs = require('fs');
const path = require('path');
const BASE = 'd:/e-Samadhan AI';
const write = (rel, content) => {
      const full = path.join(BASE, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content, 'utf8');
      console.log('wrote:', rel);
};
