const I = x => x
const W = f => x => f(x)(x)
const wrap = (first, last) => x => first + x + last
const wrap_parentheses = wrap('(', ')')
const wrap_braces = wrap('{', '}')
const wrap_brackets = wrap('[', ']')

function repeat_string(string, times) {
    let big = ''
    for (let i = 0; i < times; i++) big += string
    return big
}

function serialise_function_body(x) {
    return wrap_braces(x.map(serialise))
}

function serialise_function_arguments(x) {
    return wrap_parentheses(x.join(','))
}

function serialise_function(x) {
    return 'function ' + x[1] +
        serialise_function_arguments(x[2]) +
        serialise_function_body(x.slice([3]))
}

function serialise_curried_function(x) {
    return 'function ' +
        x[2] +
        x[3].map(wrap_parentheses).join('{return function') +
        serialise_function_body(x.slice(4)) +
        repeat_string('}', x[3].length - 1)
}

function serialise_lambda(x) {
	const xs = []
	xs.push((function() { switch(x[1].length) {
		case 0: return '()'
		case 1: return x[1][0]
		default: return wrap_parentheses(x[1].join(','))
	}})())
	xs.push('=>')
	xs.push(serialise(x[2]))
	return xs.join('')
}

function serialise_object(x) {
	const xs = []
	let even = true
	for (const y of x.slice(1)) {
		if (even) {
			xs.push(y)
			xs.push(': ')
			even = false
		} else {
			xs.push(serialise(y))
			xs.push(', ')
			even = true
		}
	}
	return wrap_braces(xs.join(''))
}

function serialise_array(x) {
    return wrap_brackets(x.slice(1).map(serialise).join(', '))
}

function serialise_call(x) {
	return x[0] + wrap_parentheses(x.slice(1).map(serialise).join(', '))
}

function serialise_sum(x) {
	return x.slice(1).map(serialise).join('+')
}

function serialise_pipe(x) {
    return x.slice(1).reverse().map(serialise).join('(') + repeat_string(')', x.length - 2)
}

function serialise_arrow(x) {
	const xs = []
	for (const y of x.slice(1).reverse())
		xs.push(serialise(y))
	xs.push('__x')
    return '__x=>' + xs.join('(') + repeat_string(')', x.length - 1)
}

function serialise_return(x) {
	return 'return ' + x.slice(1).map(serialise)
}

function serialise_var(x) {
	return 'var ' + x[1] + '=' + serialise(x[2])
}

function serialise_const(x) {
	return 'const ' + x[1] + '=' + serialise(x[2])
}

function serialise_nested(x) {
    return serialise(x[0]) + x.slice(1).map(serialise).map(wrap_parentheses)
}

function choose_serialisation_function(x) {
	if (x.constructor === Array) {
        if (x[0].constructor === Array)
            return serialise_nested
		switch (x[0]) {
			case 'function': return serialise_function
			case 'curried': return serialise_curried_function
			case 'lambda': return serialise_lambda
			case 'object': return serialise_object
			case 'array': return serialise_array
			case 'return': return serialise_return
			case '+': return serialise_sum
			case '|>': return serialise_pipe
			case '>>': return serialise_arrow
			case 'var': return serialise_var
			case 'const': return serialise_const
			default: return serialise_call
		}
	} else return I
}

const serialise = W(choose_serialisation_function)

module.exports = serialise
