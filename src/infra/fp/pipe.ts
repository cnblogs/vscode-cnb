export function pipe<A, B, C>(f1: (a: A) => B, f2: (b: B) => C) {
    return (a: A) => f2(f1(a))
}
