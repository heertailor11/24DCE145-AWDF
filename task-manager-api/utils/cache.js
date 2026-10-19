
const NodeCacheLibrary = require("node-cache");

const cache = new NodeCacheLibrary({
    stdTTL: 60,
    checkperiod: 120
});

module.exports = cache;
