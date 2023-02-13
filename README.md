# Physical Bars Middleware


## Install

```
npm i
```

## Usage

Start the server with:
```
node app.js
```

And use GET requisitions in this template:
```
http://localhost:5501/scale?value=<value>
```

Examples:
```
http://localhost:5501/scale?value=.5
```
Where the value is between domain values on te `settings` file. 

```
http://localhost:5501/scale?domain=1,2&range=20,40&data=1.5,1.2,1.8,1.6
```
This example is for user defined scales.