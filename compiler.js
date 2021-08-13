const fs = require('fs')
const parser = require('./parser.js')
const serialiser = require('./serialiser.js')

function main(file) {
	console.log(parser(fs.readFileSync(file).toString()).map(serialiser).join('\n'))
}

main(...process.argv.slice(2))
