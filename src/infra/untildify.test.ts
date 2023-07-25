import { untildify } from '@/infra/untildify'
import { homedir } from 'os'

describe('untildify', () => {
    it('should untildify', () => {
        const pathWithTilde = '~/test'
        const untildifiedPath = untildify(pathWithTilde)

        expect(untildifiedPath).toBe(homedir() + '/test')
    })
})
