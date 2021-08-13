(function myfunction (a b)
    (return (console.log (+ a b))))

(console.log (array "memes" "beams"))

(console.log (object "name" "Vas"))

(const incr (lambda (x) (+ 1 x)))

(const add (lambda (a) (lambda (b) (+ a b))))

(curried function add3nums (a b c) (return (+ a b c)))

(const add3 (>> (add 1) (add 2)))

(|> 1 (add 1) (add 2) (add -34) add3 console.log)

(console.log (((add3nums 3) 4) 3))
