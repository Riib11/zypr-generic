export default function interactString(event: KeyboardEvent, str: string): string | undefined {
    if (event.key.match(/^[0-9a-z]$/)) {
        console.log(event.key)
        return str.concat(event.key)
    }
    return undefined
}