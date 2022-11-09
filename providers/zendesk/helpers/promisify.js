module.exports = (func, thisArg) => () =>
  new Promise((resolve, reject) =>
    func.call(thisArg, ((err, req, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    })));
