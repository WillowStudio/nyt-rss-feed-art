'use strict';
const express = require('express');
const http = require('http');
const Storage = require('@google-cloud/storage');
const fs = require('fs');

const app = express();

const g_url = 'http://rss.nytimes.com/services/xml/rss/nyt/Arts.xml';
let g_requesters = null;

function downloadXml(requester) {
  if (g_requesters != null) {
    // If a download is already pending, just add the requester to the list
    // of requesters. Once the download is complete, all the callbacks in the
    // g_requesters array will be called.
    g_requesters.push(requester);
    console.log("Adding to requester list");
  }
  else {
    // Nothing is being downloaded at the moment. Reset the g_requesters array
    // and push the first requester
    g_requesters = [];
    g_requesters.push(requester);

    http.get(g_url, (resp) => {
      let data = '';
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });
      // The whole response has been received.
      resp.on('end', () => {
        for (let idx in g_requesters) {
          g_requesters[idx](data);
        }

        g_requesters = null;
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  }
}

function saveXmlToDisk(data, callback) {
  const g_filename = "Arts.xml";

  fs.writeFile(g_filename, data, (err) => {
    if (err) {
      console.log("Error saving file " + g_filename);
      return;
    }

    callback(g_filename);
  });
}

function uploadFile(filename) {
  const storage = Storage();

  storage
      .bucket("nyt-rss-feed-storage")
      .upload(filename)
      .then(() => {
    console.log("Uploaded file " + filename);

    storage
        .bucket("nyt-rss-feed-storage")
        .file(filename)
        .makePublic()
        .then(() => {
        console.log("Made '" + filename + "' publicly available");
    }).catch(err => {
        console.log("Failed to make file public!");
    });

  }).catch(err => {
    console.log("Failed to upload file " + filename);
  });
}


function mainFunc() {
  downloadXml((data) => {
    saveXmlToDisk(data, (filename) => {
      uploadFile(filename);
    });
  });
}

app.get('/launch', (req, res) => {
  mainFunc();
  res.status(200).send('done');
});

if (module === require.main) {
  // Start the server
  const server = app.listen(process.env.PORT || 8081, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;

