/**
 *  Mail   : indexxuan@gmail.com
 *  Date   : Tue 14 Mar 2017 03:19:07 PM CST
 */

/**
 * @module AuthService
 */

'use strict'

// import parser
const setCookieParser = require('set-cookie-parser')

module.exports = app => {
  /**
   * @class AuthService
   * @extends app.Service
   */
  return class AuthService extends app.Service {
    /**
     * @constructor
     * @param {Objet} ctx - 请求上下文
     */
    constructor (ctx) {
      super(ctx)
      // 首页url
      this.homeUrl = 'https://www.v2ex.com/'
      // login相关
      this.loginUrl = 'https://www.v2ex.com/signin'

      this.ctx.session.sessionCookieStr = '' // 未登录的sessionid, 供 `login` 接口放在请求Headers里的 `Set-Cookie` 项中使用
      this.ctx.session.userField = '' // 用户名 输入框埋下的随机表单域
      this.ctx.session.passField = '' // 密码   输入框埋下的随机表单域
      this.ctx.session.once = '12345'      // input[type="hidden"][name="once"]的随机令牌值(目前是5位数字)

      // signin相关
      this.signinUrl = 'https://www.v2ex.com/mission/daily'
      this.noAuth = false // 是否有权限签到 
      this.hasSignin = false // 是否能获取到 `redeem?once=` 来判断是否已经签到
    }

    /**
     * 封装统一的请求方法
     * @member
     * @param {String} url - 请求地址
     * @param {Object} opts - 请求选项
     * @returns {Promise}
     */
    async request (url, opts) {
      opts = Object.assign({
        timeout: [ '30s', '30s' ],
      }, opts)

      return await this.ctx.curl(url, opts)
    }

    /**
     * 请求首页来刷新sessionid cookie
     * @member
     * @returns {Promise}
     */
    async enterHomePage () {
      const result = await this.request(this.homeUrl)

      const session = setCookieParser(result)
      session.forEach(c => {
        this.ctx.cookies.set(c.name, c.value, {
          httpOnly: c.httpOnly,
          domain: '',
          path: c.path,
          expires: c.expires
        })
      })
    }

    /**
     * 获取登录的各种凭证
     * @member
     * @param {String} result - 请求登录页返回的response，包含html字符串和Headers
     */
    getLoginFields (result) {
      const content = result.data
      // get fileds
      const keyRe = /class="sl" name="([0-9A-Za-z]{64})"/g
      this.ctx.session.userField = keyRe.exec(content)[1]
      this.ctx.session.passField = keyRe.exec(content)[1]
      this.ctx.session.captchaField = keyRe.exec(content)[1]
      // get once
      const onceRe = /value="(\d+)" name="once"/
      this.ctx.session.once = onceRe.exec(content)[1]
      // get string session cookie
      this.ctx.session.sessionCookieStr = result.headers['set-cookie'][0]
    }

    /**
     * 获取sessionid,获取userField, passField, once等，为登录做准备
     * @member
     * @returns {Promise|void}
     */
    async enterLoginPage () {
      const result = await this.request(this.loginUrl, {
        method: 'GET',
        dataType: 'text',
        headers: this.commonHeaders
      }) 

      return this.getLoginFields(result)
    }

    async captcha () {
      // @step1 进入登录页，获取页面隐藏登录域以及once的值
      await this.enterLoginPage()
      const captchaUrl = `https://www.v2ex.com/_captcha?once=${this.ctx.session.once}`
      const opts = {
        method: 'GET',
        // contentType: 'image/png',
        headers: Object.assign({}, this.ctx.commonHeaders, { Cookie: this.ctx.session.sessionCookieStr })
      }
      const result = await this.request(captchaUrl, opts)
      return result.data
    }

    /**
     * login获取权限签名主方法
     * @method
     * @param {String} username - 用户名
     * @param {String} password - 密码 
     */
    async login ({username, password, captcha}) {
      // @step2 设置请求参数
      const opts = {
        method: 'POST',
        headers: Object.assign({}, this.ctx.commonHeaders, { Cookie: this.ctx.session.sessionCookieStr }),
        data: {
          [this.ctx.session.userField]: username,
          [this.ctx.session.passField]: password,
          [this.ctx.session.captchaField]: captcha,
          "once": this.ctx.session.once
        }
      }

      // @step3 发起请求
      const result = await this.request(this.loginUrl, opts)

      // @step4 更新session并设置在客户端
      await this.enterHomePage()
      
      // @step5 解析获取到的cookies
      const cs = setCookieParser(result)
       
      // @step6 判断是否登录成功并种下客户端cookies
      let success = false
      cs.forEach(c => {
        // 查看是否有令牌项的cookie，有就说明登录成功了
        if (c.name === this.ctx.tokenCookieName) success = true
        this.ctx.cookies.set(c.name, c.value, {
          httpOnly: c.httpOnly,
          domain: '',
          path: c.path,
          expires: c.expires
        })
      })

      // set base64(username) in cookie
      this.ctx.cookies.set('vn', btoa(username), {
        httpOnly: true
      })

      // @step7 设置API返回结果
      return {
        result: success,
        msg: success ? 'ok' : '登录失败，请确认用户名密码无误',
        data: {
          username: username
        }
      }
    }

    /**
     * 获取签到的once值
     * @member
     * @param {String} content - 签到页html字符串
     */
    getSigninOnce (content) {
      // update this.ctx.session.once
      const onceRe = /redeem\?once=(\d+)/
      const onces = onceRe.exec(content)
      /* istanbul ignore next */
      if (onces && onces[1]) {
        this.ctx.session.once = onces[1]
      } else {
        this.ctx.session.once = null
        this.hasSignin = true // 已经签到过了才获取不到once
      }
    }

    /**
     * 进入签到页面，获取once值
     * @member
     * @params {Object} {headers} - 复用请求头
     */
    async enterSigninPage ({headers}) {
      const result = await this.request(this.signinUrl, {
        method: 'GET',
        dataType: 'text',
        headers: headers
      }) 
      // 权限不足，应该是没登录
      /* istanbul ignore else */
      if (result.status === 302) {
        this.noAuth = true
      }
      // 进行解析
      this.getSigninOnce(result.data)
      return
    }

    /**
     * 签到领金币
     * @method
     */
    async signin () {
      // @step1 获取客户端凭证和各种cookies
      const session = this.ctx.sessionid
      const token = this.ctx.token
      const { tab, others } = this.ctx.commonCookies

      // @step2 设置Headers
      // 逻辑上应该不改变 `commonHeaders`　本身，不过由于 `ctx.[getter]` 的特性，每次get都是新对象，可以不加 `{}`
      const headers = Object.assign({}, this.ctx.commonHeaders,
        { Referer: 'https://www.v2ex.com/mission/daily' },
        { Cookie: `${session}; ${token}; ${tab}; ${others};` }
      )

      // @step3 进入签到页面，获取once
      await this.enterSigninPage({headers})

      // @step4 设置请求选项
      const opts = {
        dataType: 'text',
        method: 'get'
      }

      // @step5 获取请求结果，会302
      /* istanbul ignore else */
      if (this.ctx.session.once === null) {
        this.ctx.logger.info('未获取到once值,可能是已经签到过了!')
      }
      const result = await this.request(`${this.signinUrl}/redeem`, Object.assign(opts, { 
        headers: headers,
        data: { 
          'once': this.ctx.session.once
        }
      }))

      // @step6 重新进入签到页面，根据抓取到的文案确认是否签到成功（文案见底部附录@Notes）
      const page = await this.request(`${this.signinUrl}`, Object.assign(opts, {
        headers: Object.assign({}, headers, { Referer: 'https://www.v2ex.com/mission/daily/redeem' })
      }))

      // @step7 设置API返回值
      // const htmlContent = page?.data
      const htmlContent = page && page.data
      const daysMatch = page.data.match(/(已连续登录.*)<\/div>/)
      const days = daysMatch && daysMatch[1]
      /* istanbul ignore else */
      if (this.noAuth === true) {
        return {
          result: false,
          msg: '请先登录再签到'
        }
      }
      /* istanbul ignore next */
      if (htmlContent.includes('已成功领取每日登录奖励')) {
        return {
          result: true,
          msg: 'ok',
          data: {
            username: this.ctx.helper.getCurrentUserName(),
            detail: days || 'ok'
          }
        }
      }
      /* istanbul ignore next */
      if (this.hasSignin) {
        return {
          result: false,
          msg: '今天已经签到了',
          data: {
            username: this.ctx.helper.getCurrentUserName(),
            detail: days || 'ok'
          }
        }
      }
      /* istanbul ignore next */
      return {
        result: false,
        msg: '签到遇到未知错误',
        detail: app.config.env === 'prod' ? '' : page 
      }
    } // method#signin
  } // /.class=>AuthService
} // /.exports

/**
 * @Notes
 * 附录: 签到后302到原页面返回文案的比较:
 *
 * 没登录（无合法cookie）就签到
 * data: ''
 *
 * 签到成功
 * 已成功领取每日登录奖励
 * 每日登录奖励已领取
 * 查看我的账户余额
 * 已连续登录x天
 *
 *
 * 今日已签到
 * 请重新点击一次以领取每日登录奖励(用这个总感觉不太保险...）
 * 下面三个和签到成功一样...
 * 每日登录奖励已领取
 * 查看我的账户余额
 * 已连续登录x天
 *
 */
