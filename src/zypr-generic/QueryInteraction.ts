import interactString from "../StringInteraction";
import { Query } from "./Editor";

export default function interactQuery(
    event: KeyboardEvent,
    query: Query
): Query | undefined {
    if (event.key === 'ArrowUp' && query.str.length === 0) {
        event.preventDefault()
        return { str: query.str, i: query.i - 1 }
    }
    else if (event.key === 'ArrowDown' && query.str.length === 0) {
        event.preventDefault()
        return { str: query.str, i: query.i + 1 }
    }
    else if (event.key === 'Escape') {
        event.preventDefault()
        return { str: "", i: 0 }
    }
    else {
        const str = interactString(event, query.str)
        if (str === undefined) return undefined
        event.preventDefault()
        return { str, i: 0 }
    }
}