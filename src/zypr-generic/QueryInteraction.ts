import interactString from "../StringInteraction";
import { Query } from "./Editor";

export default function interactQuery(
    event: KeyboardEvent,
    query: Query
): Query | undefined {
    if (event.key === 'ArrowUp' && query.str.length === 0)
        return { str: query.str, i: query.i - 1 }
    else if (event.key === 'ArrowDown' && query.str.length === 0)
        return { str: query.str, i: query.i + 1 }
    else {
        const str = interactString(event, query.str)
        if (str === undefined) return undefined
        return { str, i: 0 }
    }
}