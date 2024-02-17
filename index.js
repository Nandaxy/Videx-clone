const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 3000;

function generateRandomId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const upload = multer({
  dest: 'file/video',
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'file/video');
    },
    filename: function (req, file, cb) {
      const randomId = generateRandomId(10); 
      const fileName = randomId + '.mp4';
      cb(null, fileName);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mpeg', 'video/quicktime'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Hanya file video yang diizinkan!'), false);
    }
    cb(null, true);
  }
});

app.use(express.static(path.join(__dirname, 'views')));

app.use('/file/video', express.static(path.join(__dirname, 'file', 'video')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/tos', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'tos.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});

app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Filenya mana bang?' });
  }

  const historyData = {
    id: req.file.filename.split('.')[0], 
    location: req.file.path,
    file: req.file.originalname,
    time: new Date().toISOString()
  };

  fs.readFile('file/history.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan saat membaca file history.' });
    }

    let history = [];
    if (data) {
      try {
        history = JSON.parse(data);
        if (!Array.isArray(history)) {
          throw new Error('Data yang dibaca bukan array');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat memproses data history.' });
      }
    }

    history.push(historyData);

    fs.writeFile('file/history.json', JSON.stringify(history, null, 2), (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan saat menulis file history.' });
      }
      res.status(200).json(historyData);
    });
  });
});

app.get('/v', (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: 'Params ID required.' });
  }

  fs.readFile('file/history.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ error: 'Terjadi kesalahan saat membaca file history.' });
    }

    let history = [];
    if (data) {
      try {
        history = JSON.parse(data);
        if (!Array.isArray(history)) {
          throw new Error('Data yang dibaca bukan array');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return res.status(500).json({ error: 'Terjadi kesalahan saat memproses data history.' });
      }
    }

    const foundItem = history.find(item => item.id === id);
    if (!foundItem) {
    
      return res.status(200).sendFile(path.join(__dirname, 'views', 'noVideo.html'));
    }

    fs.readFile('views/result.html', 'utf8', (err, htmlData) => {
      if (err) {
        console.error('Error reading HTML file:', err);
        return res.status(500).json({ error: 'Terjadi kesalahan saat membaca file HTML.' });
      }

      const html = htmlData.replace('{{id}}', foundItem.id).replace('{{location}}', foundItem.location);

      res.status(200).send(html);
    });
  });
});

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
