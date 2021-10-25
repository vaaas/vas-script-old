(macro pipe (x ...fs)
	(let result x)
	(for f fs (set result (array f result)))
	result)

(console.log (' Yo Bro))
(function test (x y) (return (console.log x y)))
; yo bro
(const test2 ; (function (x) (return x)))
	(array 1 2 3))

(const test3 (function (x) (and 1 2 x)))

(if
	(= test3 1) 1
	(= test3 2) 2
	3)

(for x (array 1 2 3) (console.log x))

(while true
	(console.log 1)
	(console.log 2))

(const my_set (new Set (array 1 2 3 4 5 6)))

(set my_set prototype 1)

(function my-map (xs) (xs.map (function (x) (+ 1 x))))

((function (x) (+ x (' yo))) (' test))

(get x 1 x 3 (' yo))

(console.log (object memes (' beams)))
