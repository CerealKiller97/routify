import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { filemapper } from '../../../plugins/filemapper/lib/index.js'
import { readFileSync } from 'fs'
import { Routify } from '../../../lib/Routify.js'
import { createBundles } from '../../../plugins/bundler/lib/index.js'
import metaFromFile from '../../../plugins/metaFromFile/lib/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const test = suite('bundler')

const options = {
    filemapper: {
        moduleFiles: ['_module.svelte', '_reset.svelte'],
        resetFiles: ['_reset.svelte'],
        routesDir: { default: `${__dirname}/example` }
    }
}

const instance = new Routify(options)
test('bundler writes files', async () => {
    await filemapper({ instance })
    await metaFromFile({ instance })
    await createBundles(instance.superNode.children[0], `${__dirname}/bundles`)

    assert.snapshot(readFileSync(__dirname + '/bundles/default_admin-bundle.js', 'utf-8'),
        'export {default as default_admin} from \'../example/admin/_reset.svelte\'' +
        '\nexport {default as default_admin_index_svelte} from \'../example/admin/index.svelte\'' +
        '\nexport {default as default_admin_page_svelte} from \'../example/admin/page.svelte\''
    )

})

test('bundled files have correct component', () => {
    const adminNode = instance.nodeIndex
        .find(node => node.name === 'admin')

    const adminImports = [adminNode, ...adminNode.descendants].map(node => node.component)

    assert.equal(adminImports, [
        'import("default_admin-bundle.js").then(r => r.default_admin)',
        'import("default_admin-bundle.js").then(r => r.default_admin_index_svelte)',
        'import("default_admin-bundle.js").then(r => r.default_admin_page_svelte)'
    ])
})

test.run()