function serialise_function(x) {
	const xs = []
	xs.push(x[0])
	xs.push(x[1])
	xs.push('(')
	xs.push(x[2])
	xs.push(')')
	xs.push('{')
	for (const y of x.slice(3).map(serialise))
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
			xs.push(serialise(y))
			xs.push(',')
			even = true
		}
	}
	xs.push('}')
	return xs.join(' ')
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
	const length = x.length - 1
	const xs = []
	for (const y of x.slice(1).reverse()) {
		xs.push('(')
		xs.push(serialise(y))
	}
	for (let i = 0; i < length; i++) xs.push(')')
	return xs.join('')
}

function serialise(x) {
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

module.exports = serialise
