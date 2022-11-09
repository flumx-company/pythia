const { UUID, UUIDV4, TEXT } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../sequelize');

const User = sequelize.define('user', {
  id: {
    type: UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  email: {
    type: TEXT,
    allowNull: false,
  },
  password: {
    type: TEXT,
    allowNull: false,
  },
}, {
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: {},
  },
});

User.addHook('beforeCreate', async user => {
  const hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
});

// User.prototype.toJSON = function toJSON() {
//   const values = Object.assign({}, this.get());

//   delete values.password;
//   return values;
// };

User.prototype.isValidPassword = async function isValidPassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;
