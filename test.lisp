(console.log (' Yo Bro))

(var x 1 y (' I like quotes "))
(const x 1 y (' I like quotes "))

(function test (x y) (return (console.log x y)))

(const test2 (function (x) (return x)))

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
