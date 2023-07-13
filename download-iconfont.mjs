/* eslint-disable no-console */
import fetch from 'node-fetch'
import fs from 'fs'
import AdmZip from 'adm-zip'
const url =
    'https://www.iconfont.cn/api/project/download.zip?spm=a313x.7781069.1998910419.d7543c303&pid=2996691&ctoken=ndNRCUzYy381Rxk59b1LjTrg'
const cookie =
    'EGG_SESS_ICONFONT=X2bT0AZ-TAIilwY-GdJPZzopst30wSOteTYESbBaXxbdSzdNvsW9cIk8Rv2OFK9WB4P6YDevBbM0tOZXSeQ-PlBr9j4tU6xOUFjFBJ0DQn-bvfiHQ9VToJtqTPiCmSRpfaiJg2PNK_U65bOD27CiBF0XriLwpr2VwR2IdTxDcEjB_TASVO4TZeLD4yutVl7F-HAekMbP05tFgoqkHKErlg==; cna=G1LxGnOXCnwCAXPBn9cnCizc; hasViewVideo=true; ctoken=tpg9HdfcXbaBj1GRmc0B9X0-; u=5429096; u.sig=TNtkaPPSd2m-XekHonfzX8cnJ4FYtYu3NQ3Ic536XRI; locale=en-us; isg=BOPj3u3ohSIY2UmfHCh8ajjwciGN2HcatGxS7hVBlcK5VAB2nKxAa4fCTizadM8S'
const filename = 'download.zip'

fetch(url, { headers: { cookie: cookie } }).then(f => {
    const dest = fs.createWriteStream('./download.zip')
    f.body?.pipe(dest)
    dest.on('finish', () => {
        try {
            const zip = AdmZip(filename, {})
            const outFileName = 'icons.woff2'
            zip.getEntries()
                .filter(e => !e.isDirectory && e.name.startsWith('iconfont.woff2'))
                .forEach(e => {
                    zip.extractEntryTo(e, './dist/assets', false, true, undefined, outFileName)
                    zip.extractEntryTo(e, 'src/assets', false, true, undefined, outFileName)
                })
            fs.unlink(filename, err => {
                if (err) {
                    console.log(err)
                }
                console.log('iconfont assets downloaded')
            })
        } catch (ex) {
            console.warn('Failed to unzip iconfont assets! Some icons may not work correctly.', ex)
        }
    })
}, undefined)
