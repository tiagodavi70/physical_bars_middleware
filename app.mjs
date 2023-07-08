import express from 'express';
const web_server = express();
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as d3 from 'd3';
import fs from 'fs';
import fetch from 'node-fetch';

// const request = require('request');

// const pages_path = __dirname + '/html';
let tags = [`<title> Generated Chart </title><img src='data:image/png;base64,`,`' alt='generated chart'/>`];
    
function getb64(t) {
    return t.substring(tags[0].length, t.length - tags[1].length - tags[0].length);
}

// https://bost.ocks.org/mike/shuffle/
function shuffle(array) {
	var m = array.length, t, i;
	// While there remain elements to shuffle…
	while (m) {
  
	  // Pick a remaining element…
	  i = Math.floor(Math.random() * m--);
  
	  // And swap it with the current element.
	  t = array[m];
	  array[m] = array[i];
	  array[i] = t;
	}  
	return array;
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
	// http://localhost:5501/mainPayload/carros_teste/MARCA/VALOR/TIPO?max=50&bars=6
	// http://localhost:5501/mainPayload/carros_teste/MARCA/VALOR/TIPO?max=50&bars=6&sort=true
	// http://localhost:5501/mainPayload/carros_teste/MARCA/VALOR/TIPO?max=50&bars=6&random=true
	// http://localhost:5501/mainPayload/carros_teste/MARCA/VALOR/TIPO?max=50&bars=6&random=true&sort=true
	// http://localhost:5501/mainPayload/carros_teste/MARCA/VALOR/TIPO?max=50&bars=6&random=true&sort=true
	web_server.get('/mainPayload/:dataset/:fieldx/:fieldy/:color', function (req, res) {
		let url_query = req.query;
		let params = req.params;

		let payload = {};
		getData(params.dataset, [params.fieldx, params.fieldy, params.color], (data) => {
			
			if (url_query["random"] == "true") { shuffle(data); }

			let colors = "";
			let nBars = +url_query["bars"] || 6;
			let categories = [...new Set(data.map(d => d.x))].slice(0, nBars);
			let colorCol = data.map(d => d.color);
			let catsColorNames = [...new Set(colorCol)].slice(0, nBars);
			let catIndexes = [];
			let colorScale = url_query["colors"];

			if (url_query["colors"] == undefined) {
				colorScale = d3.scaleOrdinal()
					.domain(catsColorNames)
					.range(d3.schemeCategory10);
			}
			function getColor(d,i) {
				return colorScale.domain ? colorScale(d) : colorScale(i) ;
			}
			colors = catsColorNames.map(getColor);
			catIndexes = catsColorNames.map((d,i) => i);

			let sizes = d3.rollup(data, v => d3.sum(v, s => s.y), d => d.x);
			sizes = Object.fromEntries(sizes);
			sizes = Object.keys(sizes).map(d => sizes[d]);
			sizes = sizes.slice(0, nBars);
			let scalebar = d => d;
			if(url_query["max"] != undefined)
				scalebar = d3.scaleLinear()
					.range([0, +url_query["max"]])
					.domain([0, d3.max(sizes)]);
			sizes = sizes.map(d => +Number(scalebar(d)).toFixed(2));

			let specialCaseColors = categories.map(d=> data.filter(row=> row.x == d)[0].color);
			payload.color = specialCaseColors.map(getColor)
			payload.colorIndex = specialCaseColors.map((d,i) => colors.indexOf(getColor(d,i)));
			payload.x = categories;
			payload.catColors = specialCaseColors.map((d,i) => d);
			payload.uniqueColors = catsColorNames;
			payload.size = sizes;

			
			if (url_query['sort'] == "true") {
				let toSort = [];
				for (let i = 0; i < payload.size.length; i++) {
					toSort.push({'s': payload.size[i], 'x': payload.x[i],
								 'c': payload.colorIndex[i], 'cat': payload.catColors[i]});
				}
				toSort.sort(function(a, b) {
					return ((a.s > b.s) ? -1 : ((a.s == b.s) ? 0 : 1));
				});
				payload.colorIndex = toSort.map(d => d.c); 
				payload.x = toSort.map(d => d.x);
				payload.size = toSort.map(d => d.s);
				payload.catColors = toSort.map(d => d.cat);
			}
			
			fetch('http://127.0.0.1:9600/mainPayload', {
				method: 'post',
				body: JSON.stringify(payload),
				headers: {'Content-Type': 'application/json'}
			});
			res.send(payload);
		});
	});
});

// function getData(dataset, x, y, cb) {
//     Promise.all([d3.text(`http://localhost:3000/field/${dataset}/${x}`),
//                  d3.text(`http://localhost:3000/field/${dataset}/${y}`)]).then( columns =>{
//         let dataX = columns[0].split(",");
//         let dataY = columns[1].split(",");
//         let data = [];
//         for (let i = 0; i < dataX.length ; i++) {
//             data.push({"x": dataX[i], "y": +dataY[i]})
//         }
// 		cb(data);
//     });
// }

function getData(dataset, cols, cb) {

    Promise.all(cols.map(d => d3.text(`http://localhost:3000/field/${dataset}/${d}`))).then( columns =>{
        let dataCols = [];
		for (let i = 0; i < columns.length; i++) dataCols.push(columns[i].split(","));

		let data = [];
		let colNames = ["x", "y", "color"];
        for (let i = 0; i < dataCols[0].length; i++) {
			let temp = {};
			for (let c = 0; c < columns.length; c++) temp[colNames[c]] = dataCols[c][i];
			data.push(temp);
        }
		cb(data);
    });
}

// http://localhost:5501/info/carros_teste/MARCA/VALOR
// http://localhost:5501/info/carros_teste/MARCA/VALOR?max=50&bars=8
// http://localhost:5501/info/carros_teste/MARCA/VALOR?bars=4
web_server.get('/info/:dataset/:fieldx/:fieldy', function (req, res) {
    let params = req.params;
    let url_query = req.query;

	getData(params.dataset, [params.fieldx, params.fieldy], (data) => {
		data = d3.rollup(data, v => d3.sum(v, s => s.y), d => d.x);
		data = Object.fromEntries(data);
		data = Object.keys(data).map(d => data[d]);
		data = data.slice(0, +url_query["bars"] || 6);
		let scalebar = d => d;
		if(url_query["max"] != undefined)
			scalebar = d3.scaleLinear()
				.range([0, +url_query["max"]])
				.domain([0, d3.max(data)]);
		res.send(data.map(d => +Number(scalebar(d)).toFixed(2)));
	});
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
            str_colors = d3.range(10).map(d => colors(d));
        } else {
            str_colors = url_query["colors"];
        }
        res.send(str_colors);
    }
    if (params.mode == "arduino" || params.mode == "both") {

    }
});



let web_port = "5501";
web_server.listen(web_port, function () {
    console.log('Web Server for chart generation started listening on port: ' + web_port);
});
