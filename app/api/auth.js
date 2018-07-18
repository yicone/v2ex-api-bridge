/**
 *  Mail   : indexxuan@gmail.com
 *  Date   : Fri 03 Mar 2017 03:22:10 PM CST
 */

/**
 * @module Auth
 * @author IndexXuan
 */

'use strict'

module.exports = app => prefix => {
  /**
   *  获取验证码
   * @method captcha
   *
   * @example
   * GET /api/v2/auth/captcha
   *
   * image/png
   */
  app.get('v2ex', `${prefix}/auth/captcha`, 'auth.captcha')


  /**
   * 登录
   * @method login
   *
   * @example
   * POST /api/v2/auth/login
   * data: { username: ${username}, password: ${password}, captcha: ${captcha} }
   *
   * {
   *   result: true|false,
   *   msg: 'ok|${errormsg}',
   *   data: {
   *     username: ${username}
   *   }
   * }
   */
  app.post('v2ex', `${prefix}/auth/login`, 'auth.login')
  app.get('v2ex', `${prefix}/auth/login`, 'auth.login') // for test

  /**
   * 签到
   * @method signin
   *
   * @example
   * POST /api/v2/auth/signin
   *
   * {
   *   result: true|false,
   *   msg: 'ok|${errormsg: e.g. 今天已经签到了}',
   *   data: {
   *     username: ${username},
   *     detail: '已连续登录XX天'
   *   }
   * }
   */
  app.post('v2ex', `${prefix}/auth/signin`, 'auth.signin')
  app.get('v2ex', `${prefix}/auth/signin`, 'auth.signin') // for test
}

