const fs = require('fs')

const parser = require('./parser.js')
const serialiser = require('./serialiser.js')

const StopIteration = Symbol()

class ParserStream {
	constructor(xs) {
		this.xs = xs
		this.i = 0
		this.length = xs.length
	}

	next() {
		if (this.i < this.length) return this.xs[this.i++]
		else return StopIteration
	}

	rollback(i=1) {
		this.i -= i
		return this
	}

	skip(i=1) {
		this.i += i
		return this
	}

	complete() {
		return this.i >= this.length
	}
}

function sexpr_parser(string) {
	const stream = new ParserStream(string)
	return Array.from(list_or_value_stream(stream))
}

function* list_or_value_stream(stream) {
	while (!stream.complete()) {
		const x = list_or_value(stream)
		if (x === StopIteration) break
		else yield x
	}
}

function list_or_value(stream) {
	skip_whitespace(stream)
	const x = stream.next()
	if (x === StopIteration) return x
	stream.rollback()
	if (x === '(') return list(stream)
	else if (x === ')') 'unexpected closing parenthesis'
	else return value(stream)
}

function list(stream) {
	const xs = []
	let x = stream.next()
	if (x !== '(') throw 'no opening parenthesis found but expected a list'
	while(!stream.complete()) {
		x = stream.next()
		if (x === ')') return xs
		stream.rollback()
		x = list_or_value(stream)
		if (x === StopIteration) throw 'no closing parethesis but expected one'
		xs.push(x)
	}
	throw 'no closing parethesis but expected one'
}

function value(stream) {
	let x = ''
	while (!stream.complete()) {
		const n = stream.next()
		if (whitespace_p(n)) break
		if (n === ')') {
			stream.rollback()
			break
		}
		else x += n
	}
	return x
}

function whitespace_p(x) {
	return [' ', '\n', '\t'].includes(x)
}

function skip_whitespace(stream) {
	while(!stream.complete()) {
		let x = stream.next()
		if (x === StopIteration) break
		else if (whitespace_p(x)) continue
		else return stream.rollback()
	}
}

function serialise_function(x) {
	const xs = []
	xs.push(x[0])
	xs.push(x[1])
	xs.push('(')
	xs.push(x[2])
	xs.push(')')
	xs.push('{')
	for (const y of x.slice(3).map(serialise_js))
		xs.push(y)
	xs.push('}')
	return xs.join(' ')
}

function serialise_object(x) {
	const xs = []
	xs.push('{')
	let even = true
	for (const y of x.slice(1)) {
		if (even) {
			xs.push(y)
			xs.push(':')
			even = false
		} else {
			xs.push(serialise_js(y))
			xs.push(',')
			even = true
		}
	}
	xs.push('}')
	return xs.join(' ')
}

function serialise_array(x) {
	return '[' + x.slice(1).map(serialise_js).join(', ') + ']'
}

function serialise_call(x) {
	return x[0] + '(' + x.slice(1).map(serialise_js).join(', ') + ')'
}

function serialise_sum(x) {
	return x.slice(1).map(serialise_js).join('+')
}

function serialise_pipe(x) {
	const length = x.length - 1
	const xs = []
	for (const y of x.slice(1).reverse()) {
		xs.push('(')
		xs.push(serialise_js(y))
	}
	for (let i = 0; i < length; i++) xs.push(')')
	return xs.join('')
}

function serialise_js(x) {
	if (x.constructor === Array) {
		switch (x[0]) {
			case 'function': return serialise_function(x)
			case 'object': return serialise_object(x)
			case 'array': return serialise_array(x)
			case '+': return serialise_sum(x)
			case '|>': return serialise_pipe(x)
			default: return serialise_call(x)
		}
	} else return x
}

function main(file) {
	console.log(sexpr_parser(fs.readFileSync(file).toString()).map(serialise_js).join('\n'))
}

main(...process.argv.slice(2))
