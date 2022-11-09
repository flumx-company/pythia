const tailwindcss = require('tailwindcss');
const atImport = require('postcss-import');
const cssnext = require('postcss-cssnext');

module.exports = {
  plugins: [
    atImport(),
    tailwindcss('./tailwind.config.js'),
    cssnext({
      browsers: 'last 2 versions, not < 1%',
    }),
  ],
};
