const authReq = {
  login: function (data) {
    return window.DAPI({
      url: '/login',
      method: 'POST',
      data
    })
  }
}

export default authReq;