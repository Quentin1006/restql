# RESTQL

## Next Steps

- Add properties to schema: method, params, body, condition(parent, ctx): Boolean, etc.
- Handle links (Possibly it could be a url as a pattern) ex
  `url: "${parent._links.contractsSignes.href}"`

- Handle case where `then` presents an array of url, ex:

1. Call contracts => return an array of contracts
2. execute the same then for each contracts
