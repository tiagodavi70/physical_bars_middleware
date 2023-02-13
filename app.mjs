import express from 'express';
const web_server = express();
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as d3 from 'd3';
import fs from 'fs';

// const pages_path = __dirname + '/html';

web_server.get('/', function (req, res) {
    res.sendFile('/index.html');
});
fs.readFile("settings.json", "utf8", (err, data_raw) => {
    if (err) throw err;
    let settings = JSON.parse(data_raw);
    web_server.get('/scale', function (req, res) {
        let url_query = req.query;
        if (url_query["value"] != undefined) {
            let scale = d3.scaleLinear()
                .domain(settings.scale.domain)
                .range(settings.scale.range)
            res.send(""+scale(+url_query["value"]));
        } else {
            let scale = d3.scaleLinear()
                .domain(url_query["domain"].split(",").map(d=> +d))
                .range(url_query["range"].split(",").map(d=> +d))
            let data = url_query["data"].split(",").map(d => scale(+d))
            res.send(JSON.stringify(data));
        }
    }); 
});

let web_port = "5501";
web_server.listen(web_port, function () {
    console.log('Web Server for chart generation started listening on port: ' + web_port);
});

    

