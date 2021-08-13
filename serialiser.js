function repeat_string(string, times) {
    let big = ''
    for (let i = 0; i < times; i++) big += string
    return big
}

function serialise_function_body(x) {
    return '{' + x.map(serialise) + '}'
}

function serialise_function_arguments(x) {
    return '(' + x.join(',') + ')'
}

function serialise_function(x) {
    return 'function ' + x[1] +
        serialise_function_arguments(x[2]) +
        serialise_function_body(x.slice([3]))
}

function serialise_curried_function(x) {
    const xs = []
    for (const y of x[3])
        xs.push('(' + y + ')')
    return 'function ' +
        x[2] +
        xs.join('{return function') +
        serialise_function_body(x.slice(4)) +
        repeat_string('}', x[3].length - 1)
}

function serialise_lambda(x) {
	const xs = []
	xs.push((function() { switch(x[1].length) {
		case 0: return '()'
		case 1: return x[1][0]
		default: return '(' + x[1].join(',') + ')'
	}})())
	xs.push('=>')
	xs.push(serialise(x[2]))
	return xs.join('')
}

function serialise_object(x) {
	const xs = []
	xs.push('{')
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
	xs.push('}')
	return xs.join('')
}

function serialise_array(x) {
	return '[' + x.slice(1).map(serialise).join(', ') + ']'
}

function serialise_call(x) {
	return x[0] + '(' + x.slice(1).map(serialise).join(', ') + ')'
}

function serialise_sum(x) {
	return x.slice(1).map(serialise).join('+')
}

function serialise_pipe(x) {
	const xs = []
	for (const y of x.slice(1).reverse())
		xs.push(serialise(y))
    return xs.join('(') + repeat_string(')', x.length - 2)
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

function serialise(x) {
    console.log(x)
	if (x.constructor === Array) {
		switch (x[0]) {
			case 'function': return serialise_function(x)
			case 'curried': return serialise_curried_function(x)
			case 'lambda': return serialise_lambda(x)
			case 'object': return serialise_object(x)
			case 'array': return serialise_array(x)
			case 'return': return serialise_return(x)
			case '+': return serialise_sum(x)
			case '|>': return serialise_pipe(x)
			case '>>': return serialise_arrow(x)
			case 'var': return serialise_var(x)
			case 'const': return serialise_const(x)
			default: return serialise_call(x)
		}
	} else return x
}

module.exports = serialise
