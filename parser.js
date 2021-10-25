'use strict'

const whitespace = [' ', '\n', '\t']

class ParserStream {
	constructor(x) {
		this.x = x
		this.len = x.length
		this.i = 0
	}

	done() { return this.i >= this.len }

	next() {
		if (this.done()) throw 'end of stream'
		else return this.x[this.i++]
	}

	peek() {
		if (this.done()) throw 'end of stream'
		else return this.x[this.i]
	}

	skip(i=1) {
		this.i += i
		return this
	}

	until(xs) {
		while (!this.done()) {
			if (xs.includes(this.peek())) return
			else this.skip()
		}
	}
}

function sexp(stream) {
	const xs = []
	while (!stream.done()) {
		const x = stream.peek()
		if (whitespace.includes(x)) stream.skip()
		else if (x === ';') stream.until('\n')
		else if (x === ')') {
			stream.skip()
			return xs
		}
		else if (x === '(') xs.push(sexp(stream.skip()))
		else xs.push(atom(stream))
	}
	throw 'unexpected end of stream'
}

function atom(stream) {
	let xs = ''
	while (!stream.done()) {
		const x = stream.peek()
		if (['(', ')', ...whitespace].includes(x)) break
		else if (x === ';') {
			stream.until('\n')
			break
		} else if (x === '\\') {
			stream.skip()
			if (stream.done()) {
				xs += x
				break
			} else xs += stream.next()
		} else xs += stream.next()
	}
	return xs
}

module.exports = function main(data) {
	const stream = new ParserStream(data)
	const xs = []
	while (!stream.done()) {
		const x = stream.peek()
		if (whitespace.includes(x)) stream.skip()
		else if (x === ';') stream.until('\n')
		else if (x === ')') throw 'unexpected token ' + x
		else if (x === '(') xs.push(sexp(stream.skip()))
		else xs.push(atom(stream))
	}
	return xs
}
