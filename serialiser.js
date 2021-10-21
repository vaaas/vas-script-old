const I = x => x
const W = f => x => f(x)(x)

const wrap = (first, last) => x => first + x + last
const wrap_parentheses = wrap('(', ')')
const wrap_braces = wrap('{', '}')
const wrap_brackets = wrap('[', ']')
const wrap_quotes = wrap('"', '"')
const wrap_spaces = wrap(' ', ' ')

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
	return x[0] + wrap_parentheses(x.slice(1).map(serialise).join(', '))
}

function serialise_string(x) {
	return wrap_quotes(x.slice(1).join(' ').replaceAll('"', '\\"'))
}

function serialise_var(x) {
	return x[0] + ' ' + map_pairwise((name, value) => name + ' = ' + serialise(value), x.slice(1)).join(', ')
}

function serialise_function(x) {
	const xs = []
	let body = 2
	xs.push(x[0])
	if (stringp(x[1])) {
		xs.push(x[1])
		body = 3
	}
	xs.push(wrap_parentheses(x[body-1].join(', ')))
	xs.push(wrap_braces(x.slice(body).map(serialise).join(';')))
	return xs.join(' ')
}

function serialise_arrow(x) {
	const xs = []
	if (stringp(x[1]))
		xs.push(x[1])
	else if (listp(x[1]))
		xs.push(wrap_parentheses(x[1].join(', ')))
	xs.push('=>')
	if (x.length === 3)
		xs.push(serialise(x[2]))
	else
		xs.push(x.slice(1).map(serialise).join(';'))
	return xs.join(' ')
}

function serialise_infix(x, infix=null) {
	return x.slice(1).map(serialise).join(wrap_spaces(infix ?? x[0]))
}

function serialise_if(x) {
	return map_pairwise(
		(a, b) => [a, '?', b, ':'].join(' '),
		x.slice(1, -1).map(serialise))
	.join(' ') + ' ' + serialise(x[x.length-1])
}

function serialise_for(x) {
	return 'for ' + wrap_parentheses('const ' + serialise(x[1]) + ' of ' + serialise(x[2])) + wrap_braces(x.slice(3).map(serialise).join(';'))
}

function serialise_array(x) {
	return wrap_brackets(x.slice(1).map(serialise).join(','))
}

function serialise_while(x) {
	return 'while ' + wrap_parentheses(serialise(x[1])) + wrap_braces(x.slice(2).map(serialise).join(';'))
}

function serialise_expression(x) {
	switch (x[0]) {
		case "'": return serialise_string(x)
		case 'array': return serialise_array(x)
		case 'object': return serialise_object(x)
		case 'const':
		case 'let':
		case 'var': return serialise_var(x)
		case 'function': return serialise_function(x)
		case 'lambda': return serialise_arrow(x)
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
		default: return serialise_call(x)
	}
}

module.exports = serialise
