'use strict'

const fs = require('fs')
const parser = require('./parser.js')

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
const tail = x => x.slice(1)
const last = x => x[x.length - 1]

const tap = f => x => { f(x) ; return x }

String.prototype.replaceAll = function(from, to) {
	return this.replace(new RegExp(from, 'g'), to)
}

const listp = x => x.constructor === Array
const stringp = x => x.constructor === String

const plus = (f, a) => b => f(b, a)

function map_pairwise(f, x) {
	const xs = []
	for (let i = 0; i < x.length; i += 2)
		xs.push(f(x[i], x[i+1]))
	return xs
}

function serialise(x, macros) {
	if (listp(x)) return serialise_expression(x, macros)
	else if (stringp(x)) return x
}

function serialise_call(x, macros) {
	return first(x) + wrap_parentheses(tail(x).map(plus(serialise, macros)).join(', '))
}

function serialise_string(x, macros) {
	return wrap_quotes(tail(x).join(' ').replaceAll('"', '\\"'))
}

function serialise_var(x, macros) {
	return first(x) + ' ' +
		map_pairwise((name, value) => name + ' = ' + serialise(value, macros), tail(x)).join(', ')
}

function serialise_function(x, macros) {
	let xs = ''
	let body = 2
	xs += 'function '
	if (stringp(second(x))) {
		xs += second(x)
		body = 3
	}
	xs += wrap_parentheses(x[body-1].join(', '))
	body = x.slice(body)
	const lb = last(body)
	if (stringp(lb) || (listp(lb) && first(lb) !== 'return'))
		body[body.length-1] = ['return', lb]
	xs += wrap_braces(body.map(plus(serialise, macros)).join('; '))
	return xs
}

function serialise_infix(x, macros, infix=null) {
	return tail(x).map(plus(serialise, macros)).join(wrap_spaces(infix ?? first(x)))
}

function serialise_if(x, macros) {
	return map_pairwise(
		(a, b) => [a, '?', b, ':'].join(' '),
		x.slice(1, -1).map(plus(serialise, macros))
	).join(' ') + ' ' + serialise(last(x), macros)
}

function serialise_for(x, macros) {
	return 'for ' +
		wrap_parentheses('const ' + second(x) + ' of ' + serialise(third(x), macros)) +
		wrap_braces(x.slice(3).map(plus(serialise, macros)).join('; '))
}

function serialise_array(x, macros) {
	return wrap_brackets(tail(x).map(plus(serialise, macros)).join(', '))
}

function serialise_while(x, macros) {
	return 'while ' + wrap_parentheses(serialise(second(x), macros)) + wrap_braces(x.slice(2).map(plus(serialise, macros)).join('; '))
}

function serialise_return(x, macros) {
	return first(x) + ' ' + tail(x).map(plus(serialise, macros)).join(',')
}

function serialise_new(x, macros) {
	return first(x) + ' ' +
		serialise(second(x), macros) +
		wrap_parentheses(x.slice(2).map(plus(serialise, macros)))
}

function serialise_set(x, macros) {
	if (x.length === 2)
		return serialise(x, macros) + ' = null'
	else if (x.length > 2)
		return x.slice(1, x.length-1).map(plus(serialise, macros)).join('.') + ' = ' + serialise(last(x), macros)
}

function serialise_get(x, macros) {
	return serialise(second(x), macros) + x.slice(2).map(y => wrap_brackets(serialise(y, macros))).join('')
}

function serialise_dot(x, macros) {
	return [ serialise(second(x), macros), ...x.slice(2) ].join('.')
}

function serialise_nested(x, macros) {
	return wrap_parentheses(serialise(first(x), macros)) + wrap_parentheses(tail(x).map(plus(serialise, macros)))
}

function serialise_object(x, macros) {
	return wrap_braces(map_pairwise((k, v) => k + ': ' + serialise(v, macros), tail(x)).join(', '))
}

function serialise_spread(x, macros) {
	return '...' + wrap_parentheses(tail(x).map(serialise))
}

function macroexpand(x, macros) {
	if (listp(x)) {
		x = x.map(macroexpand)
		const f = macros[first(x)]
		if (!f) return x
		else return f(...tail(x))
	} else return x
}

function serialise_expression(x, macros) {
	x = macroexpand(x, macros)
	if (listp(first(x))) return serialise_nested(x, macros)
	else if (stringp(first(x))) switch (first(x)) {
		case "'": return serialise_string(x, macros)
		case 'array': return serialise_array(x, macros)
		case 'object': return serialise_object(x, macros)
		case 'const':
		case 'let':
		case 'var': return serialise_var(x, macros)
		case 'macro': return ''
		case 'function': return serialise_function(x, macros)
		case '*':
		case '+':
		case '/':
		case '-':
		case '%':
		case '**': return serialise_infix(x, macros)
		case 'and': return serialise_infix(x, macros, '&&')
		case 'or': return serialise_infix(x, macros, '||')
		case '=': return serialise_infix(x, macros, '===')
		case '!=': return serialise_infix(x, macros, '!==')
		case 'if': return serialise_if(x, macros)
		case 'for': return serialise_for(x, macros)
		case 'while': return serialise_while(x, macros)
		case 'return': return serialise_return(x, macros)
		case 'new': return serialise_new(x, macros)
		case 'set': return serialise_set(x, macros)
		case 'get': return serialise_get(x, macros)
		case '.': return serialise_dot(x, macros)
		case '...': return serialise_spread(x, macros)
		default: return serialise_call(x, macros)
	}
}

function main(file) {
	const xs = pipe(file, fs.readFileSync, x => x.toString(), parser)
	const macros = xs.filter(x => listp(x) && (first(x) === 'macro'))
		.reduce((xs, x) => {
			xs[second(x)] = eval(wrap_parentheses(serialise_function(x, xs)))
			return xs
		}, {})
	console.log(Object.values(macros).map(x => x.toString()))
	console.log(xs.map(plus(serialise, macros)).join('\n'))
}

main(...process.argv.slice(2))
