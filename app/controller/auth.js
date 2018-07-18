/**  
 *  Author : IndexXuan(https://github.com/IndexXuan)
 *  Mail   : indexxuan@gmail.com
 *  Date   : Tue 14 Mar 2017 03:15:19 PM CST
 */

/**
 * @module AuthController
 */

'use strict'

module.exports = app => {
  /**
   * @class AuthController
   * @extends app.Controller
   */
  return class AuthController extends app.Controller {
    async captcha () {
      const { ctx } = this
      ctx.type = 'png'
      const body = await ctx.service.auth.captcha()
      ctx.length = Buffer.byteLength(body);
      ctx.body = body
    }

    /**
     * 登录
     * @returns {Object}
     */
    async login () {
      const { ctx } = this
      const { username, password, captcha } = ctx.request.body
      if (username == null) {
        throw new Error('请传入用户名')
      }
      if (password == null) {
        throw new Error('请传入密码')
      }
      if (captcha == null) {
        throw new Error('请传入验证码')
      }
      ctx.body = await ctx.service.auth.login({username, password, captcha})
    }

    /**
     * 签到
     * @returns {Object}
     */
    async signin () {
      const { ctx } = this
      ctx.body = await ctx.service.auth.signin()
    }
  } // /.class=>AuthController
} // /.exports

