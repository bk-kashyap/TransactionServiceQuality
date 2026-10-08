const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const spec = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '../contract/transactions-service.v1.yaml'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true });
ajv.addKeyword({ keyword: 'example', valid: true });
const validators = Object.fromEntries(Object.entries(spec.definitions).map(([name, schema]) => [name, ajv.compile(schema)]));
function validateSchema(name, body) {
  const validate = validators[name];
  if (!validate) throw new Error(`Unknown contract definition: ${name}`);
  if (!validate(body)) throw new Error(`${name}: ${ajv.errorsText(validate.errors, { separator: '\n' })}`);
}
function validateResponse(method, route, status, body) {
  const response = spec.paths[route]?.[method.toLowerCase()]?.responses[String(status)];
  if (!response) throw new Error(`Undocumented response: ${method} ${route} -> ${status}`);
  const name = response.schema?.$ref?.split('/').pop();
  if (!name) throw new Error(`Missing response schema: ${method} ${route} -> ${status}`);
  validateSchema(name, body);
}
module.exports = { spec, validators, validateSchema, validateResponse };
