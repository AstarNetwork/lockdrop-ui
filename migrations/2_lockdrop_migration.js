const Lockdrop = artifacts.require('Lockdrop');

module.exports = function(deployer) {
  const currentTime = Math.floor(Date.now() / 1000);
  deployer.deploy(Lockdrop, currentTime);
};
