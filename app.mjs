import express from 'express';
const web_server = express();
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as d3 from 'd3';
import fs from 'fs';
import { scaleLinear } from 'd3';

// const pages_path = __dirname + '/html';
let tags = [`<title> Generated Chart </title><img src='data:image/png;base64,`,`' alt='generated chart'/>`];
    
function getb64(t) {
    return t.substring(tags[0].length, t.length - tags[1].length - tags[0].length);
}

// web_server.get('/', function (req, res) {
//     res.sendFile('/index.html');
// });

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

web_server.get('/info', function (req, res) {}); // ?

let url_vizgen = "http://localhost:3000/chartgen.html?x=orange,pear,strawberry,apple&y=1,2,3,4&chart=piechart&colors=rgb(255,103,0);rgb(144,238,144);rgb(252,90,141);rgb(255,8,0)"
let url_vizgen_base = "http://localhost:3000/chartgen.html"

// http://localhost:5501/arduino/visualization
// http://localhost:5501/ra/visualization
// http://localhost:5501/both/visualization?x=orange,pear,pineapple,strawberry&y=1,2,3,4&chart=barchartvertical&title=title
web_server.get('/:mode/visualization', function (req, res) {
    let vizgen_query = req.originalUrl.split("?")[1];
    let params = req.params;
    // console.log(`${url_vizgen2}?${vizgen_query}`);

    if (params.mode == "ra" || params.mode == "both") {
        d3.text(`${url_vizgen_base}?${vizgen_query}`).then(text => {
            res.send(tags[0] + getb64(text) + tags[1]);
        });   
    }
    if (params.mode == "arduino" || params.mode == "both") {

    }
});

// http://localhost:5501/arduino/colors
// http://localhost:5501/ra/colors
// http://localhost:5501/both/colors
web_server.get('/:mode/colors?', function (req, res) {
    let url_query = req.query;
    let params = req.params;

    if (params.mode == "ra" || params.mode == "both") {
        let str_colors = "";
        if (url_query["colors"] == undefined) {
            let colors = d3.scaleLinear(d3.schemeCategory10);
            str_colors = d3.range(10).map(d=>colors(d));
        } else {
            str_colors = url_query["colors"];
        }
        res.send(str_colors);
    }
    if (params.mode == "arduino" || params.mode == "both") {

    }
    // res.send("Requisition wrong");
});

let web_port = "5501";
web_server.listen(web_port, function () {
    console.log('Web Server for chart generation started listening on port: ' + web_port);
});

    

