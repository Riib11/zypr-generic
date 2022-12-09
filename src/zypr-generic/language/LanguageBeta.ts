import { List } from "immutable"
import * as Language from "../Language"

export type Pre = Language.Pre<Met, Rul, Val>
export type Exp = Language.Exp<Met, Rul, Val>
export type Zip = Language.Zip<Met, Rul, Val>

export type Met
  = 'bnd'
  | 'exp'

export type Rul
  // bnd
  = 'bnd'
  // exp
  | 'var'
  | 'app'
  | 'lam'
  | 'let'
  | 'hol'

export type Val = BndVal | VarVal | AppVal | LamVal | LetVal | HolVal
export type BndVal = { label: string }
export type VarVal = { label: string }
export type AppVal = { indentedArg: boolean }
export type LamVal = { indentedBod: boolean }
export type LetVal = { indentedImp: boolean, indentedBod: boolean }
export type HolVal = {}

export function isAppApl(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'app' && zip.kidsLeft.size === 0
}

export function isAppArg(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'app' && zip.kidsLeft.size === 1
}

export function isLamBnd(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'lam' && zip.kidsLeft.size === 0
}

export function isLamBod(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'lam' && zip.kidsLeft.size === 1
}

export function isLetImp(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'let' && zip.kidsLeft.size === 1
}

export function isLetBod(zip: Zip | undefined): boolean {
  return zip !== undefined && zip.rul === 'let' && zip.kidsLeft.size === 2
}

export function prettyPre(pre: Pre): string {
  switch (pre.rul) {
    case 'bnd': return "@\"" + (pre.val as BndVal).label + "\""
    case 'var': return "\"" + (pre.val as VarVal).label + "\""
    case 'app': return "(_ _)"
    case 'lam': return "(_ ↦ _)"
    case 'let': return "(let _ = _ in _)"
    case 'hol': return "?"
  }
}

export default function language(): Language.Language<Met, Rul, Val> {
  let grammar: Language.Grammar<Met, Rul, Val> = {
    rules: (met) => ({
      'bnd': [] as Rul[],
      'exp': ['var', 'app', 'hol'] as Rul[]
    }[met]),
    valueDefault: (rul) => ({
      'bnd': { label: "" } as Val,
      'var': { label: "" } as Val,
      'app': { indentedArg: false } as Val,
      'lam': { indentedBod: false } as Val,
      'let': { indentedImp: false, indentedBod: false } as Val,
      'hol': {} as Val
    }[rul]),
    kids: (rul) => ({
      'bnd': [] as Met[],
      'var': [] as Met[],
      'app': ['exp', 'exp'] as Met[],
      'lam': ['bnd', 'exp'] as Met[],
      'let': ['bnd', 'exp', 'exp'] as Met[],
      'hol': [] as Met[]
    }[rul]),
    holeRule: (met) => ({
      'bnd': 'bnd' as Rul,
      'exp': 'hol' as Rul
    }[met])
  }

  function isParenthesized(zips: List<Zip>, exp: Exp): boolean {
    let zip = zips.get(0)
    if (zip === undefined) return false
    switch (exp.rul) {
      case 'bnd': return false
      case 'var': return false
      case 'app': return !(isAppApl(zip) || isLetImp(zip) || isLetBod(zip))
      case 'lam': return !(isLamBod(zip) || isLetImp(zip) || isLetBod(zip))
      case 'let': return isAppArg(zip)
      case 'hol': return false
    }
  }

  function isIndentable(zips: List<Zip>, exp: Exp): boolean {
    let zip = zips.get(0)
    if (zip === undefined) return false
    if (isAppArg(zip) || isLamBod(zip)) return true
    return false
  }

  return {
    grammar,
    isParenthesized,
    isIndentable
  }
}