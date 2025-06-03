const authReq = {
  login: function (data) {
    return window.DAPI({
      url: '/login',
      method: 'POST',
      data
    })
  },
  test: function () {
    return window.DAPI({
      url: '/test',
      method: 'get',
    })
  },
}

export default authReq;