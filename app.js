'use strict';
const express = require('express');
const http = require('http');
const app = express();

let g_cachedContent = null;
let g_cachedTime = null;
let g_requesters = null;

function getCacheAgeInHours() {
	return ((new Date()) - g_cachedTime) / 3600000;
}

function downloadFile(callback) {
  if (g_requesters != null) {
	// If a download is already pending, just add the callback to the list
	// of requesters. Once the download is complete, all the callbacks in the
	// g_requesters array will be called.
	g_requesters.push(callback);
	console.log("Adding to requester list");
  }
  else {
	// Nothing is being downloaded at the moment. Reset the g_requesters array
	// and push the first callback
    g_requesters = [];
	g_requesters.push(callback);

    http.get('http://rss.nytimes.com/services/xml/rss/nyt/Arts.xml', (resp) => {
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

function sendResponseToClient(res, data) {
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(data);
}

app.get('/Arts.xml', (req, res) => {
  if (g_cachedTime && getCacheAgeInHours() < 3.0) {
    sendResponseToClient(res, g_cachedContent);
  }
  else {
    g_cachedTime = null;
	g_cachedContent = null;

    downloadFile((data) => {
      g_cachedContent = data;
	  g_cachedTime = new Date();
      sendResponseToClient(res, data);
    });
  }
});

if (module === require.main) {
  // Start the server
  const server = app.listen(process.env.PORT || 8081, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}
module.exports = app;

