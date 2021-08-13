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

function parser(string) {
	const stream = new ParserStream(string)
	return Array.from(list_or_value_stream(stream))
}

function* list_or_value_stream(stream) {
	let x = list_or_value(stream)
	while (x !== StopIteration) {
		yield x
		x = list_or_value(stream)
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
		else if (n === '(') throw 'unexpected opening parenthesis'
		else if (n === ')') {
			stream.rollback()
			break
		} else x += n
	}
	return x
}

function whitespace_p(x) {
	return [' ', '\n', '\t'].includes(x)
}

function skip_whitespace(stream) {
	while(!stream.complete()) {
		let x = stream.next()
		if (whitespace_p(x)) continue
		else return stream.rollback()
	}
}

module.exports = parser
