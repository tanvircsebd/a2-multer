/*
    Name: Riad Tanvir Hassan
    ID: N01532744
*/
require("dotenv").config();
const multer = require("multer");
const express = require("express");
const paginate = require("express-paginate");
var cors = require('cors')
const app = express();
//const PORT = process.env.PORT || PORT;

const PORT = 3000;
const path = require("path")
const fs = require("fs")


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// app.use(express.static('public'));
// app.use(express.static('./upload'));
app.use('/upload', express.static(path.join(__dirname, 'upload')));
console.log(__dirname)
app.use(paginate.middleware(3, 50));
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // cb(null, "./uploads");
      cb(null, "./upload")
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  
  const upload = multer({ storage: storage });


  //single upload route
  app
  .route("/upload")
  .get((req, res) => {
    res.sendFile (path.join(__dirname, "views", "upload.html"));
  })
  .post(upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.send(`File uploaded successfully: ${req.file.path}`);
  });


  //Multiple upload routes

  app
  .route("/upload-multiple")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
  })
  .post(upload.array("files", 100), (req, res) => {
    //console.log(files.length)
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.path);
    res
      .status(200)
      .send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });


  //sending/fetching single file

  app.get("/fetch-single", (req, res) => {
    let upload_dir = path.join(__dirname, "upload");
  
    // NOTE: This reads the directory, not the file, so think about how you can use this for the assignment
    let uploads = fs.readdirSync(upload_dir);
    // Add error handling
    if (uploads.length == 0) {
      return res.status(503).send({
        message: "No images",
      });
    }
    let max = uploads.length - 1;
    let min = 0;
  
    let index = Math.round(Math.random() * (max - min) + min);
    let randomImage = uploads[index];
  
    res.sendFile(path.join(upload_dir, randomImage));
  });

  app.get("/fetch-multiple", (req, res) => {
    //console.log("Received request for multiple images");
    
    let upload_dir = path.join(__dirname, "upload");
    let numImages = parseInt(req.query.num) || 2; // Default to 1 image if not specified
  
    let uploads = fs.readdirSync(upload_dir);
  
    if (uploads.length === 0) {
      return res.status(503).send({
        message: "No images",
      });
    }
  
    if (numImages > uploads.length) {
      return res.status(400).send({
        message: `Requested ${numImages} images, but only ${uploads.length} are available`,
      });
    }
  
    let selectedImages = [];
    let indexes = new Set();
  
    while (indexes.size < numImages) {
      let index = Math.floor(Math.random() * uploads.length);
      indexes.add(index);
    }
  
    indexes.forEach((index) => {
      selectedImages.push(`/upload/${uploads[index]}`);
    });
  
    //console.log("Selected images:", selectedImages);
    res.json(selectedImages);
  });

  // app.get("/fetch-multiple", (req, res) => {
  //   console.log(req.query.num)
  //   let upload_dir = path.join(__dirname, "upload");
  //   let numImages = parseInt(req.query.num) || 1; // Default to 1 image if not specified

  //   let uploads = fs.readdirSync(upload_dir);
  
  //   if (uploads.length == 0) {
  //     return res.status(503).send({
  //       message: "No images",
  //     });
  //   }
  
  //   if (numImages > uploads.length) {
  //     return res.status(400).send({
  //       message: `Requested ${numImages} images, but only ${uploads.length} are available`,
  //     });
  //   }
  
  //   let selectedImages = [];
  //   let indexes = new Set();
  
  //   while (indexes.size < numImages) {
  //     let index = Math.floor(Math.random() * uploads.length);
  //     indexes.add(index);
  //   }
  
  //   indexes.forEach((index) => {
  //     selectedImages.push(uploads[index]);
  //   });
  
  //   res.send(
  //     selectedImages.map((image) => path.join(upload_dir, image))
  //   );
  // });
  
  app.get("/gallery", (req, res) => {
    let upload_dir = path.join(__dirname, "upload");
  
    let uploads = fs.readdirSync(upload_dir);
  
    if (uploads.length === 0) {
      return res.status(503).send({
        message: "No images",
      });
    }
  
    let imagePaths = uploads.map(file => `/upload/${file}`);
    res.json(imagePaths);
  });


  app.get('/', (req, res)=>{
    //res.render('index');
    //read all the files in the public/uploads

    fs.readdir("./upload", (err, files)=>{
        if(err){
            //console.err(err);
            res.status(500).json({error: "error reading image directory"});
        }else{
            const images = files.filter((file)=> file.endsWith(".jpg") || file.endsWith(".png"))
            console.log(images);
            const itemCount = images.length;

            // console.log(itemCount);
            const pageCount = Math.ceil(itemCount/req.query.limit);
            const paginateResult = paginate.getArrayPages(req)(3, itemCount, req.query.page);
            // console.log(paginateResult);
            const startIndex = req.skip;
            const endIndex = startIndex + req.query.limit;
            const paginatedImages = images.slice(startIndex, endIndex);
            const currentPage = req.query.page ? parseInt(req.query.page) : 1
            const prev = currentPage > 1 ? req.baseUrl + `?page = ${currentPage - 1} & limit = ${req.query.limit}`: null;
            const next = currentPage < pageCount ? req.baseUrl + `?page = ${currentPage + 1} & limit = ${req.query.limit}`:null;
        //    const next = currentPage < pageCount ? req.baseUrl + `?page = ${currentPage + 1} & limit = ${req.query.limit}`:null;
            const first = req.baseUrl + `?page=1&limit=${req.query.limit}`;
            const last = req.baseUrl + `?page=${pageCount}&limit=${req.query.limit}`;

            res.render("index", {
                images: paginatedImages,
                pages: paginate.getArrayPages(req)(3, pageCount, req.query.page),
                prev: prev,
                next: next,
                first: first,
                last: last,
            });

        }
    })
})


// add your routes as you see fit

app.use((req, res) => {
    res.status(404).send("Route not found");
});

  

app.listen(PORT, () => {
  console.log(`Server Started: http://localhost:${PORT}`);
});
