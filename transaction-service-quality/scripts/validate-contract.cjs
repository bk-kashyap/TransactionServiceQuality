const parser = require('@apidevtools/swagger-parser');
const { validators } = require('./contract.cjs');
parser.validate(require('node:path').join(__dirname, '../contract/transactions-service.v1.yaml'))
  .then(() => {
    console.log('Supplied Swagger contract: structurally valid; references resolved.');
    for (const [name, validate] of Object.entries(validators)) console.log(`${name}: empty object accepted = ${validate({})} (recorded contract gap)`);
  }).catch(error => { console.error(error); process.exitCode = 1; });
