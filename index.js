const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const ms = require('mediaserver');

const { databaseReader, databaseWriter } = require('./DatabaseOperations/databaseOperations');

const app = express();

app.use(fileUpload());

app.get("/file/:filename", (req, res) => {
    filename = req.params.filename;
    databaseReader(filename)
        .then(size => {
            //stream.pipe(res);
            ms.pipe(req, res, filename);  
        })
        .catch(err => console.log(err))
        .finally(() => {
            if (fs.existsSync(filename)) {
                fs.unlink(filename, err => {
                    if (err)
                        console.log(err);
                });
            }
        });
});

app.post("/file", (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
      }
    
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      const file = req.files.file;
      const filename = file.name;

      // Use the mv() method to place the file somewhere on your server
      file.mv(filename, function(err) {
        if (err)
          return res.status(500).send(err);
        
        //Writing file to the database
        databaseWriter(filename)
        .then((oid) => {
            console.log(`${filename} saved with oid ${oid}`);
            fs.unlink(filename, err => {
                if (err)
                    console.log(err);
            });
            res.send('File uploaded!');
        })
        .catch(err => res.status(500).send(err.message))
        .finally(() => {
            if (fs.existsSync(filename)) {
                fs.unlink(filename, err => {
                    if (err)
                        console.log(err);
                });
            }
        });
      });
});

app.use("/", (req, res) => {
    res.send("Server working");
});

console.log("listening on port 3000...");
app.listen(3000);