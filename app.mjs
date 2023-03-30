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
    // http://localhost:5501/scale?domain=0,10&range=10,20&data=1,2,3,4,5
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

// http://localhost:5501/info/carros_teste/MARCA/VALOR
// http://localhost:5501/info/carros_teste/MARCA/VALOR?max=50&bars=8
// http://localhost:5501/info/carros_teste/MARCA/VALOR?bars=4
web_server.get('/info/:dataset/:fieldx/:fieldy', function (req, res) {
    let params = req.params;
    let url_query = req.query;

    Promise.all([d3.text(`http://localhost:3000/field/${params.dataset}/${params.fieldx}`),
                 d3.text(`http://localhost:3000/field/${params.dataset}/${params.fieldy}`)]).then( columns =>{
        let datax = columns[0].split(",");
        let datay = columns[1].split(",");
        
        let data = [];
        for (let i = 0; i < datax.length ; i++) {
            data.push({"x": datax[i], "y": +datay[i]})
        }
        data = d3.rollup(data, v => d3.sum(v, s=>s.y), d => d.x);
        data = Object.fromEntries(data);
        data = Object.keys(data).map(d => data[d]);
        data = data.slice(0, +url_query["bars"] || 6);
        let scalebar = d => d;
        if(url_query["max"] != undefined)
            scalebar = d3.scaleLinear()
                .range([0, +url_query["max"]])
                .domain([0, d3.max(data)]);
        res.send(data.map(d => +Number(scalebar(d)).toFixed(2)));
    })
});

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
web_server.get('/:mode/colors', function (req, res) {
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

    

