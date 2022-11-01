export type Foo_<A> = [A, (a: A) => boolean]

export type Foo = <R>(run: <A>(_: Foo_<A>) => R) => R

const foo:
  <A>(foo_: Foo_<A>) => Foo =
  <A>(foo_: Foo_<A>): Foo => run => run(foo_)

const foos = [
  foo([3, (x) => x % 2 == 0]),
  foo([true, (b) => !b])
]

// type Nat = Zero | Suc
// type Zero = { case: 'zero' }
// type Suc = { case: 'suc', pred: Nat }

// type Nat<A> = Zero
// type Zero<A> = 'zero'
// type Suc<A> = { suc: A }

// type Pred<M> = M extends Nat<infer N> ? N : never

// function pred<M>(m: M): Pred<M> {
//   const t = typeof m
// }

// type Add1<A, N extends Nat<A>> = 
//   N extends Zero ? Zero : 
//   N extends Suc<A> ? Suc<Add1<A, Zero>> :
//   void