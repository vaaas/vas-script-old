const StopIteration = Symbol()
const WHITESPACE = [' ', '\n', '\t']
const ATOM_STOP = [...WHITESPACE, '(', ')']

class ParserStream {
	constructor(xs) {
		this.xs = xs
		this.i = 0
		this.length = xs.length
	}

	next() {
		if (!this.done()) return this.xs[this.i++]
		else return StopIteration
	}

	peek() {
		if (!this.done()) return this.xs[this.i]
		else return StopIteration
	}

	rollback(i=1) {
		this.i -= i
		return this
	}

	done() {
		return this.i >= this.length
	}

	until(f) {
		while (true) {
			const x = this.next()
			if (x === StopIteration) break
			else if (f(x)) { this.rollback() ; break }
		}
		return this
	}
}

function main(string) {
	const stream = new ParserStream(string)
	return Array.from(sexp_stream(stream))
}

function* sexp_stream(stream) {
	while (true) {
		const x = sexp(stream)
		if (x === StopIteration) break
		else yield x
	}
}

function sexp(stream) {
	stream.until(x => !WHITESPACE.includes(x))
	switch (stream.peek()) {
		case StopIteration: return StopIteration
		case '(': return expression(stream)
		case ')': throw 'unexpected closing parenthesis'
		default: return atom(stream)
	}
}

function expression(stream) {
	const xs = []
	const x = stream.next()
	if (x !== '(') throw 'no opening parenthesis found but expected one'
	while(true) {
		const x = stream.next()
		if (x === StopIteration) throw 'no closing parethesis but expected one'
		else if (x === ')') return xs
		else {
			stream.rollback()
			const x = sexp(stream)
			if (x === StopIteration) throw 'no closing parethesis but expected one'
			else xs.push(x)
		}
	}
}

function atom(stream) {
	let xs = ''
	while (true) {
		const x = stream.next()
		if (x === StopIteration) return xs
		else if (x === '\\') {
			if (stream.done()) xs += x
			else xs += stream.next()
		} else if (ATOM_STOP.includes(x)) {
			stream.rollback()
			return xs
		} else xs += x
	}
}

module.exports = main
