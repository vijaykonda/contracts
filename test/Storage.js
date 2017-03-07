const assertJump = require('../helpers/assertJump')
const crypto = require('crypto')
const BigNumber = require('bignumber.js')
const Storage = artifacts.require("../contracts/storage/Storage.sol")

contract('Storage', (accounts) => {
  const creator = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  let storage


  before('Create storage and set whitelist', () => {
    return Storage.new({
      from: creator
    }).then((_storage) => {
      console.log('created storage')
      storage = _storage
    })
  });

  it('Should allow to write data to one of whitelist members and read that data', () => {
    const hash = "0x" + crypto.randomBytes(32).toString("hex")
    const value = 1

    return storage.setUIntValue.sendTransaction(hash, value, {
      from: creator
    }).then((txId) => {
      assert.notEqual(txId, null)
      return storage.getUIntValue.call(hash)
    }).then((_value) => {
      assert.equal(value.toString(), _value.toString(10))
    })
  })

  it('Should doesn\'t allow to write data for not whitelisted account', () => {
    const hash = "0x" + crypto.randomBytes(32).toString("hex")
    const value = 1

    return storage.setUIntValue.sendTransaction(hash, value, {
      from: user1
    }).then((txId) => {
      assert.equal(txId, null)
    }).catch(err => {
      assert.notEqual(err, null)
    })
  })

  it('Shouldn\'t allow to add new member from not whitelisted account', () => {
    return storage.addMember.sendTransaction(user1, {
      from: user1
    }).then((txId) => {
      assert.equal(txId, null)
    }).catch((err) => {
      assert.notEqual(err, null)
    })
  })

  it('Should allow to add another member to whitelist', () => {
    return storage.addMember.sendTransaction(user1, {
      from: creator
    }).then((txId) => {
      assert.notEqual(txId, null)
    })
  })

  it('Should allow to write data from new member', () => {
    const hash = "0x" + crypto.randomBytes(32).toString("hex")
    const value = 1

    return storage.setUIntValue.sendTransaction(hash, value, {
      from: user1
    }).then((txId) => {
      assert.notEqual(txId, null)
    })
  })

  it('Should write all kind of data successfully', () => {
    const data = [
      {
        set: 'setIntValue',
        get: 'getIntValue',
        value: new BigNumber(-1)
      },
      {
        set: 'setUIntValue',
        get: 'getUIntValue',
        value: new BigNumber(1)
      },
      {
        set: 'setStringValue',
        get: 'getStringValue',
        value: 'Hello, world'
      },
      {
        set: 'setAddressValue',
        get: 'getAddressValue',
        value: creator
      },
      {
        set: 'setBytesValue',
        get: 'getBytesValue',
        value: "0x" + crypto.randomBytes(32).toString("hex")
      },
      {
        set: 'setBooleanValue',
        get: 'getBooleanValue',
        value: true
      }
    ]

    let promises = []
    let hashes = []

    for (let i in data) {
      const hash = "0x" + crypto.randomBytes(32).toString("hex")
      promises.push(storage[data[i].set].sendTransaction(hash, data[i].value))
      hashes.push({
        hash: hash,
        value: data[i].value,
        get: data[i].get
      })
    }

    return Promise.all(promises).then((results) => {
      results.forEach((result) => assert.notEqual(result, null))

      promises = hashes.map((hash) => {
        return storage[hash.get].call(hash.hash)
      })

      return Promise.all(promises)
    }).then((results) => {
      for (let i in results) {
        if (typeof results[i] === 'object') {
          assert.equal(results[i].toString(10), hashes[i].value.toString(10))
        } else {
          assert.equal(results[i], hashes[i].value)
        }
      }
    })
  })
})