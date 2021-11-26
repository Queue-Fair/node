module.exports = {
  service: function(req, res) {
    return new QueueFairService(req, res);
  },
};

/** Class encapsulating low-level functions */
class QueueFairService {
  res;
  req;
  doneNoCache = false;
  isSecure = false;

  /**
   * @param {Object} req an express request
   * @param {Object} res an express result
   */
  constructor(req, res) {
    this.res = res;
    this.req= req;
    if (req.protocol == 'https') {
      this.isSecure = true;
    }
  }

  /**
   * @param {string} cname the name of the cookie.
   * @return {string} the cookie value, or null if not found.
   */
  getCookie(cname) {
    if (typeof this.req.cookies[cname] === 'undefined') {
      return null;
    }
    return this.req.cookies[cname];
  }

  /**
   * @param {string} cname the full name of the cookie.
   * @param {string} value the value to store.
   * @param {string} lifetimeSeconds how long the cookie persists
   * @param {string} path the cookie path
   * @param {string} cookieDomain optional cookie domain.
   */
  setCookie(cname, value, lifetimeSeconds, path, cookieDomain) {
    this.noCache();
    const cookie = {
      maxAge: lifetimeSeconds*1000,
      expire: Date.now()+(lifetimeSeconds*1000),
      path: path,
    };
    if (this.isSecure) {
      cookie.secure = true;
      cookie.sameSite = 'none';
    }
    if (cookieDomain != null) {
      cookie.domain = cookieDomain;
    }
    this.res.cookie(cname, value, cookie);
  }

  /**
   * Sets no-cache headers if needed.
   */
  noCache() {
    if (this.doneNoCache) {
      return;
    }
    this.doneNoCache=true;
    this.addHeader('Cache-Control', 'no-store,no-cache,max-age=0');
  }

  /**
   * @param {string} hname header name.
   * @param {string} value header value.
   */
  addHeader(hname, value) {
    this.res.setHeader(hname, value);
  }

  /**
   * @param {string} loc where to send the visitor. 302 redirect.
   */
  redirect(loc) {
    this.noCache();
    this.res.redirect(loc);
  }

  /**
   * @return {string} the IP address of the visitor
   */
  remoteAddr() {
    let ip = this.req.headers['x-forwarded-for'] ||
          this.req.connection.remoteAddress ||
          this.req.socket.remoteAddress ||
          this.req.connection.socket.remoteAddress;
    ip = ip.split(',')[0];

    // in case the ip returned in a format: "::ffff:127.xxx.xxx.xxx"
    ip = ip.split(':').slice(-1);

    return ip;
  }
}
