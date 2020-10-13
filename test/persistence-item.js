'use strict'

const PersistenceItem = require('../lib/server-code/api/persistence-item')
const { APP_PATH, forTest, prepareMockRequest } = require('./helpers/sdk-sandbox')

describe('PersistenceItem', function() {

  forTest(this)

  const testObjectId = 'test-object-id'

  class Foo extends PersistenceItem {
  }

  it('should compute valid class name', function() {
    expect(new Foo().___class).to.be.equal('Foo')
  })

  it('should find by id', async function() {
    const req1 = prepareMockRequest({ name: 'bob' })

    const result = await Foo.findById(testObjectId)

    expect(req1).to.deep.include({
      path   : `${APP_PATH}/data/Foo/test-object-id`,
      method : 'GET',
      headers: {},
      body   : undefined
    })

    expect(result).to.deep.include({ ___class: 'Foo', name: 'bob' })
  })

  it('should find by id with relations', async function() {
    const req1 = prepareMockRequest({ name: 'bob' })

    const result = await Foo.findById(testObjectId, ['rel-1', 'rel-2'])

    expect(req1).to.deep.include({
      method : 'GET',
      path   : `${APP_PATH}/data/Foo/test-object-id?loadRelations=rel-1,rel-2`,
      headers: {},
      body   : undefined
    })

    expect(result).to.deep.include({ ___class: 'Foo', name: 'bob' })
  })

  it('should find by id with relations and properties', async function() {
    const req1 = prepareMockRequest({ name: 'bob' })

    const result = await Foo.findById(testObjectId, ['rel-1', 'rel-2'], ['prop-1', 'prop-2'])

    expect(req1).to.deep.include({
      method : 'GET',
      path   : `${APP_PATH}/data/Foo/test-object-id?property=prop-1&property=prop-2&loadRelations=rel-1,rel-2`,
      headers: {},
      body   : undefined
    })

    expect(result).to.deep.include({ ___class: 'Foo', name: 'bob' })
  })

  it('should return objects count', async function() {
    const req1 = prepareMockRequest(123)

    const result = await Foo.count('foo>123')

    expect(req1).to.deep.include({
      method : 'GET',
      path   : `${APP_PATH}/data/Foo/count?where=foo%3E123`,
      headers: {},
      body   : undefined
    })

    expect(result).to.be.equal(123)
  })
})