import { Readable } from 'stream'

export function readableToBytes(readable: Readable): Promise<Uint8Array> {
    return new Promise(resolve => {
        const bufs: Buffer[] = []
        readable.on('readable', () => {
            const chunk = <Buffer | null>readable.read()

            if (chunk !== null) {
                bufs.push(chunk)
            } else {
                const buf = Buffer.concat(bufs)
                const bytes = new Uint8Array(buf)
                resolve(bytes)
            }
        })
    })
}
