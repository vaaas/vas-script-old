(function myfunction (a b)
    (return (console.log (+ a b))))

(console.log (array "memes" "beams"))

(console.log (object "name" "Vas" "surname" "Pas"))

(const incr (lambda (x) (+ 1 x)))

(const add (lambda (a) (lambda (b) (+ a b))))

(curried function add3nums (a b c) (return (+ a b c)))

(const add3 (comp (add 1) (add 2)))

(pipe 1 (add 1) (add 2) (add -34) add3 console.log)

(console.log (apply add3nums 1 2 3))
