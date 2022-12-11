import { List } from "immutable"
// import * as Language from "../Language"

// export type Pre = Language.Pre<Met, Rul, Val>
// export type Exp = Language.Exp<Met, Rul, Val>
// export type Zip = Language.Zip<Met, Rul, Val>

// export type Met
//   = 'ty' | 'ty-bnd'
//   | 'tm' | 'tm-bnd'
//   | 'ty-bnd-list' | 'ty-list' | 'tm-list'


// // <ty> ::= <ty-hol> | <ty-var> [<ty>] | <ty> → <ty>
// // <tm> ::= <tm-hol> | <tm-var> [<tm>] | <tm-bnd> ↦ <tm>
// //        | let <tm-bnd> : <ty> = <tm> in <tm>
// //        | let type <ty-bnd> [<ty-bnd>] = <ty> in <tm>
// //        | let data <ty-bnd> [<ty-bnd>] = [| <tm-bnd> [<ty>]] in <tm>
// export type Rul
//   // ty
//   = 'ty-hol' | 'ty-neu' | 'ty-arr'
//   // tm
//   | 'tm-hol' | 'tm-neu' | 'tm-lam' | 'tm-let-term' | 'tm-let-type' | 'tm-let-data'
//   // *-bnd
//   | 'ty-bnd' | 'tm-bnd'
//   // *-list
//   | 'ty-bnd-list-cons' | 'ty-bnd-list-nil' | 'ty-list-cons' | 'ty-list-nil' | 'tm-list-cons' | 'tm-list-nil'

// export type Val = BndVal | VarVal | AppVal | LamVal | LetVal | HolVal
// export type BndVal = { label: string }
// export type VarVal = { label: string }
// export type AppVal = { indentedArg: boolean }
// export type LamVal = { indentedBod: boolean }
// export type LetVal = { indentedImp: boolean, indentedBod: boolean }
// export type HolVal = {}

// export default function language(): Language.Language<Met, Rul, Val> {
//   let grammar: Language.Grammar<Met, Rul, Val> = {
//     rules: (met) => ({
//       'bnd': [] as Rul[],
//       'exp': ['var', 'app', 'hol'] as Rul[]
//     }[met]),
//     valueDefault: (rul) => ({
//       'bnd': { label: "" } as Val,
//       'var': { label: "" } as Val,
//       'app': { indentedArg: false } as Val,
//       'lam': { indentedBod: false } as Val,
//       'let': { indentedImp: false, indentedBod: false } as Val,
//       'hol': {} as Val
//     }[rul]),
//     kids: (rul) => ({
//       'bnd': [] as Met[],
//       'var': [] as Met[],
//       'app': ['exp', 'exp'] as Met[],
//       'lam': ['bnd', 'exp'] as Met[],
//       'let': ['bnd', 'exp', 'exp'] as Met[],
//       'hol': [] as Met[]
//     }[rul]),
//     holeRule: (met) => ({
//       'bnd': 'bnd' as Rul,
//       'exp': 'hol' as Rul
//     }[met])
//   }

//   function isParenthesized(zips: List<Zip>, exp: Exp): boolean {
//     let zip = zips.get(0)
//     if (zip === undefined) return false
//     switch (exp.rul) {
//       case 'bnd': return false
//       case 'var': return false
//       case 'app': return !(isAppApl(zip) || isLetImp(zip) || isLetBod(zip))
//       case 'lam': return !(isLamBod(zip) || isLetImp(zip) || isLetBod(zip))
//       case 'let': return isAppArg(zip)
//       case 'hol': return false
//     }
//   }

//   function isIndentable(zips: List<Zip>, exp: Exp): boolean {
//     let zip = zips.get(0)
//     if (zip === undefined) return false
//     if (isAppArg(zip) || isLamBod(zip)) return true
//     return false
//   }

//   return {
//     grammar,
//     isParenthesized,
//     isIndentable
//   }
// }