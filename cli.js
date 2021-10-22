'use strict'

const fs = require('fs')
const parser = require('./parser.js')

class Macro {
	constructor(sexp) {
		this.symbol
	}
}

class Sexp {
	constructor(sexp) {
		this.sexp = sexp
	}

	toString() {
		return serialise(this.sexp)
	}
}

class Scope {
	constructor(parent=null, sexps=[]) {
		this.parent = parent
		this.sexps = []
		for (const x of sexps)
			this.add_sexp(x)
	}

	add_sexp(x) {
		this.sexps.push(x)
		return this
	}

	toString() {
		return this.sexps.map(x => x.toString()).join('\n')
	}
}

const I = x => x
const W = f => x => f(x)(x)
const N = o => x => new o(x)

const str = x => ''+x
const concat_arrays = xs => xs.reduce((xs, x) => { for (const i of x) xs.push(i) ; return xs }, [])
const pipe = (x, ...fs) => { let a = x ; for (const f of fs) a = f(a) ; return a }
const map = f => x => x.map(f)

const wrap = (first, last) => x => first + x + last
const wrap_parentheses = wrap('(', ')')
const wrap_braces = wrap(' { ', ' }')
const wrap_brackets = wrap('[', ']')
const wrap_quotes = wrap('"', '"')
const wrap_spaces = wrap(' ', ' ')

const first = x => x[0]
const second = x => x[1]
const third = x => x[2]
const head = x => x.slice(0, x.length -1)
const tail = x => x.slice(1)
const last = x => x[x.length - 1]

String.prototype.replaceAll = function(from, to){
	return this.replace(new RegExp(from, 'g'), to)
}

function make_string(string, times) {
	let big = ''
	for (let i = 0; i < times; i++) big += string
	return big
}

const listp = x => x.constructor === Array
const stringp = x => x.constructor === String
const numberp = x => !Number.isNaN(parseFloat(x))

function map_pairwise(f, x) {
	const xs = []
	for (let i = 0; i < x.length; i += 2)
		xs.push(f(x[i], x[i+1]))
	return xs
}

function serialise(x) {
	if (listp(x)) return serialise_expression(x)
	else if (stringp(x)) return x
}

function serialise_call(x) {
	return first(x) + wrap_parentheses(tail(x).map(serialise).join(', '))
}

function serialise_string(x) {
	return wrap_quotes(tail(x).join(' ').replaceAll('"', '\\"'))
}

function serialise_var(x) {
	return first(x) + ' ' +
		map_pairwise((name, value) => name + ' = ' + serialise(value), tail(x)).join(', ')
}

function serialise_function(x) {
	let xs = ''
	let body = 2
	xs += first(x) + ' '
	if (stringp(second(x))) {
		xs += second(x)
		body = 3
	}
	xs += wrap_parentheses(x[body-1].join(', '))
	body = x.slice(body)
	const lb = last(body)
	if (stringp(lb) || (listp(lb) && first(lb) !== 'return'))
		body[body.length-1] = ['return', lb]
	xs += wrap_braces(body.map(serialise).join('; '))
	return xs
}

function serialise_infix(x, infix=null) {
	return tail(x).map(serialise).join(wrap_spaces(infix ?? first(x)))
}

function serialise_if(x) {
	return map_pairwise(
		(a, b) => [a, '?', b, ':'].join(' '),
		x.slice(1, -1).map(serialise))
	.join(' ') + ' ' + serialise(last(x))
}

function serialise_for(x) {
	return 'for ' +
		wrap_parentheses('const ' + second(x) + ' of ' + serialise(third(x))) +
		wrap_braces(x.slice(3).map(serialise).join('; '))
}

function serialise_array(x) {
	return wrap_brackets(tail(x).map(serialise).join(', '))
}

function serialise_while(x) {
	return 'while ' + wrap_parentheses(serialise(second(x))) + wrap_braces(x.slice(2).map(serialise).join('; '))
}

function serialise_return(x) {
	return first(x) + ' ' + tail(x).map(serialise).join(',')
}

function serialise_new(x) {
	return first(x) + ' ' +
		serialise(second(x)) +
		wrap_parentheses(x.slice(2).map(serialise))
}

function serialise_set(x) {
	if (x.length === 2)
		return serialise(x) + ' = null'
	else if (x.length > 2)
		return x.slice(1, x.length-1).map(serialise).join('.') + ' = ' + serialise(last(x))
}

function serialise_get(x) {
	return serialise(second(x)) + x.slice(2).map(y => wrap_brackets(serialise(y))).join('')
}

function serialise_nested(x) {
	return wrap_parentheses(serialise(first(x))) + wrap_parentheses(tail(x).map(serialise))
}

function serialise_expression(x) {
	if (listp(first(x))) return serialise_nested(x)
	else if (stringp(first(x))) switch (first(x)) {
		case "'": return serialise_string(x)
		case 'array': return serialise_array(x)
		case 'object': return serialise_object(x)
		case 'const':
		case 'let':
		case 'var': return serialise_var(x)
		case 'function': return serialise_function(x)
		case '*':
		case '+':
		case '/':
		case '-':
		case '**': return serialise_infix(x)
		case 'and': return serialise_infix(x, '&&')
		case 'or': return serialise_infix(x, '||')
		case '=': return serialise_infix(x, '===')
		case '!=': return serialise_infix(x, '!==')
		case 'if': return serialise_if(x)
		case 'for': return serialise_for(x)
		case 'while': return serialise_while(x)
		case 'return': return serialise_return(x)
		case 'new': return serialise_new(x)
		case 'set': return serialise_set(x)
		case 'get': return serialise_get(x)
		default: return serialise_call(x)
	}
}

function main(file) {
	const GlobalScope = pipe(
		file,
		fs.readFileSync,
		x => x.toString(),
		parser,
		map(N(Sexp)),
		x => new Scope(null, x))
	console.log(GlobalScope.toString())
}

main(...process.argv.slice(2))
