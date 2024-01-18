module.exports = (env) => {
  return require(`./webpack.${env.goal}.js`);
};
