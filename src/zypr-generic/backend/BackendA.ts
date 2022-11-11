import { List, Record, RecordOf } from "immutable";
import { EndoPart } from "../../Endo";
import * as Backend from "../Backend";
import { Dat, Exp, PreExp, Step, Zip } from "../language/Language1";
import { buildExpNode, Node } from "../Node";

type Env = RecordOf<{
    indented: boolean
}>

export default function backend1(): Backend.Backend<Exp, Zip, Dat> {

    const initEnv: Env = Record({
        indented: false
    })()

    function nextEnv(
        preExp: PreExp,
        i: number,
        env: Env
    ): Env {
        switch (preExp.case) {
            case 'var': return env
            case 'app': {
                if (i == 1) return env.set('indented', true)
                else return env
            }
        }
    }

    function applyEnv(env: Env, node: Node<Dat>): void {
        node.dat.indented = env.indented
    }

    const formatPreExp = (preExp: PreExp, env: Env, kids: Node<Dat>[]): Node<Dat> => {
        // throw new Error("TODO: can i not use buildExpNode after all?");
        return buildExpNode(
            {
                preExp,
                indented: env.indented
            },
            kids
        )
    }

    const formatExp = (exp: Exp) => (env: Env): Node<Dat> => {
        switch (exp.case) {
            case 'var': return formatPreExp(exp, env, [])
            case 'app':
                return formatPreExp(
                    exp,
                    env,
                    [exp.apl, exp.arg].map((kid, i) =>
                        formatExp(kid)(nextEnv(exp, i, env))))
        }
    }

    const formatZip = (zip: Zip) => (node: ((env: Env) => Node<Dat>)): (env: Env) => Node<Dat> => {
        const step = zip.get(0)
        if (step === undefined) {
            return node
        } else {
            return formatZip(zip.shift())((env) =>
                formatPreExp(step, env,
                    (step.kidsLeft.reverse().map((kid, i) => formatExp(kid)(nextEnv(step, i, env)))
                        .concat(List([node(nextEnv(step, step.kidsLeft.size + 1, env))]))
                        .concat(step.kidsLeft.map((kid, i) => formatExp(kid)(nextEnv(step, i, env))))
                    ).toArray()
                )
            )
        }
    }

    function interpQuery(mode: Backend.Mode<Exp, Zip>,
        str: string
    ): Backend.QueryInterp<Exp, Zip>[] {
        // throw new Error("TODO");
        return []
    }

    function handleAction(
        act: Backend.Action<Exp, Zip>
    ): EndoPart<Backend.State<Exp, Zip, Dat>> {
        // throw new Error("TODO");
        return (st) => st
    }

    const initExp: Exp = {
        case: 'var',
        dat: { label: "x" }
    }

    return Backend.buildBackend<Exp, Step, Dat, Env>(
        initEnv,
        formatExp,
        formatZip,
        interpQuery,
        handleAction,
        initExp
    )
}