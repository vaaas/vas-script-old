(macro pipe (x ...fs)
	(let r x)
	(for f fs (set r (array f r)))
	r)

(macro arrow (...fs)
	(let r (' x))
	(for f fs (set r (array f r)))
	(array (' function) (array (' x)) r))

(function add (a) (function (b) (+ a b)))
(const inc (add 1))
(function divisible (a) (function (b) (= 0 (% b a))))
(const even (divisible 2))
(function filter (f) (function (x) ((. x filter) f)))
(function map (f) (function (x) ((. x map) f)))

(pipe 1 inc even console.log)
(const solution (arrow inc even console.log))

(pipe (array 1 2 3) (map inc) (filter even) console.log)
(const solution2 (arrow (map inc) (filter even) console.log))
