import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';

const app = express();
const PORT = 3000;

// ES module_dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`Node app running on port ${PORT}`));
