const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid= require('gridfs-stream');
const methodOverride = require('method-override');
require('dotenv').config();

const app = express();

//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//Mongo URI
const mongoURI = `mongodb+srv://BigMac:${process.env.DBpw}@cluster0.1cxsy.mongodb.net/${process.env.DBname}?retryWrites=true&w=majority`

// Create Mongo connection
const conn = mongoose.createConnection(mongoURI, { useUnifiedTopology: true, useNewUrlParser: true });

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
    res.redirect('/');
})

app.get('/files', (req, res)=> {
    gfs.files.find().toArray((err, files)=>{
        if(!files || files.length == 0){
            return res.status(404).json({
                err: "no files exist"
            });
        }
        return res.json(files);
    })
})

app.get('/files/:filename', (req, res)=> {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        if(!file || file.length === 0){
            return res.status(404).json({
                err: 'no file exist'
            })
        }
        return res.json({file})
    })
})


app.get('/image/:filename', (req, res)=> {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        if(!file || file.length === 0){
            return res.status(404).json({
                err: 'no file exist'
            })
        }
        if(file.contentType === '/image/jpeg'||file.contentType==='image/png'||file.contentType==='/image/jpg'){
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else{
            res.status(404).json({
                err: 'not an img'
            })
        }
    })
})

const port = 5000;

app.listen(port, () => console.log(`server started on port ${port}`));


// const express = require('express');
// const bodyParser = require('body-parser');
// const path = require('path');
// const crypto = require('crypto');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const GridFsStorage = require('multer-gridfs-storage');
// const Grid= require('gridfs-stream');
// const methodOverride = require('method-override');
// require('dotenv').config();

// const app = express();

// //Middleware
// app.use(bodyParser.json());
// app.use(methodOverride('_method'));
// app.set('view engine', 'ejs');

// //Mongo URI
// const mongoURI = `mongodb+srv://BigMac:${process.env.DBpw}@cluster0.1cxsy.mongodb.net/${process.env.DBname}?retryWrites=true&w=majority`

// // Create Mongo connection
// const promise = mongoose.connect(mongoURI, { useUnifiedTopology: true, useNewUrlParser: true});
// const conn = mongoose.connection;
// // Init gfs
// let gfs;

// conn.once('open', () => {
//     //Init stream
//     gfs = Grid(conn, mongoose.mongo);
//     gfs.collection('uploads');
// })

// //Create storage engine
// const storage = new GridFsStorage({
//     db: promise,
//     file: (req, file) => {
//       return new Promise((resolve, reject) => {
//         crypto.randomBytes(16, (err, buf) => {
//           if (err) {
//             return reject(err);
//           }
//           const filename = buf.toString('hex') + path.extname(file.originalname);
//           const fileInfo = {
//             filename: filename,
//             bucketName: 'uploads'
//           };
//           resolve(fileInfo);
//         });
//       });
//     }
//   });
//   const upload = multer({ storage });

// app.get('/', (req, res)=> {
//     res.render('index');
// });


// app.post('/upload', upload.single('file'), (req, res) => {
//     res.json({file: req.file})
// })

// const port = 5000;

// app.listen(port, () => console.log(`server started on port ${port}`));

