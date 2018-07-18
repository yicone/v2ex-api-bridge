/**
 *  @Test
 *  @module auth#controller
 *  ---------------------------------------------
 *  Author : IndexXuan(https://github.com/IndexXuan)
 *  Mail   : indexxuan@gmail.com
 *  Date   : Mon 27 Mar 2017 05:15:18 PM CST
 */

'use strict'

const request = require('supertest')
const mock    = require('egg-mock')
const assert  = require('assert')

describe('test/app/controller/members.test.js', () => {

  // App
  let app
  before(() => {
    // 通过 `egg-mock` 快速创建一个应用实例
    app = mock.app()
  })
  // 每一个测试过后都重置mock app
  afterEach(mock.restore)

  it('should got captcha', async () => {
    const r1 = await request(app.callback())
      .get('/api/v2/auth/captcha')
      .expect(200)

    assert(Buffer.isBuffer(r1.body))
    console.log(r1.body.toString('base64'))
  })

  it.only('1 should login success', async () => {
    const r = await request(app.callback())
      .get('/api/v2/auth/login?username=indexxuantest2&password=justtest&captcha=suaecqcs')
      .expect(200)

    const item = r.body
    assert(typeof item === 'object')
    assert(item.result === true)
    assert(item.msg === 'ok')
    assert(item.data.username === 'indexxuantest2')
  })

  it('2 should login failed', async () => {
    const r = await request(app.callback())
      .get('/api/v2/auth/login?username=indexxuantest2&password=wrongpassword')
      .expect(200)

    const item = r.body
    assert(typeof item === 'object')
    assert(item.result === false)
    assert(item.msg === '登录失败，请确认用户名密码无误')
    assert(item.data.username === 'indexxuantest2')
  })

  it('3 should login failed with no username', async () => {
    const r = await request(app.callback())
      .get('/api/v2/auth/login?name=notusername&password=waowao')
      .expect(500)

    const error = r.body.error
    assert(typeof error === 'object')
    assert(error.msg === '请传入用户名')
  })

  it('4 should login failed with no password', async () => {
    const r = await request(app.callback())
      .get('/api/v2/auth/login?username=indexxuantest2&notpassword=waowao')
      .expect(500)

    const error = r.body.error
    assert(typeof error === 'object')
    assert(error.msg === '请传入密码')
  })

  it('5 should signin failed with no cookie in test case', async () => {
    const r = await request(app.callback())
      .get('/api/v2/auth/signin')
      .expect(200)

    const error = r.body
    assert(typeof error === 'object')
    assert(error.msg === '请先登录再签到')
  })

}) // /.describe

