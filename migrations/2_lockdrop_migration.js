const Lockdrop = artifacts.require("Lockdrop");

module.exports = function (deployer, network) {
  const currentTime = Math.floor(Date.now() / 1000);
  if (network.startsWith("mainnet")) {
    const firstLockdropStart = "1584230400"; // 15th March
    deployer.deploy(Lockdrop, firstLockdropStart);
  } else {
    deployer.deploy(Lockdrop, currentTime);
  }
};
