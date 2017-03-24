/**
 *  @Controller
 *  @Module auth 
 *  ---------------------------------------------
 *  Author : IndexXuan(https://github.com/IndexXuan)
 *  Mail   : indexxuan@gmail.com
 *  Date   : Tue 14 Mar 2017 03:15:19 PM CST
 */

module.exports = app => {
  return class AuthController extends app.Controller {

    async login (ctx) {
      const { username, password } = ctx.query
      if (username == null) {
        throw new Error('请传入用户名！')
      }
      if (password == null) {
        throw new Error('请传入密码！')
      }
      ctx.body = await ctx.service.auth.login(ctx.query)
    }

    async signin (ctx) {
      ctx.body = await ctx.service.auth.signin(ctx.query)
    }

  } // /.class=>AuthController
}
