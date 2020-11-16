const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid= require('gridfs-stream');
const methodOverride = require('method-override');


const app = express();

//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//Mongo URI
const mongoURI = `mongodb+srv://BigMac:${process.env.DBpw}@cluster0.1cxsy.mongodb.net/${process.env.DBname}?retryWrites=true&w=majority`

// Create Mongo connection
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true });

// Init gfs
let gfs;

conn.once('open', () => {
    //Init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

//Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

app.get('/', (req, res)=> {
    res.render('index');
});


app.post('/upload', upload.single('file'), (req, res) => {
    res.json({file: req.file})
})

const port = 5000;

app.listen(port, () => console.log(`server started on port ${port}`));