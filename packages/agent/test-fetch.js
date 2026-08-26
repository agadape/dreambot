fetch('https://markets.stg.somnia.host/v1/graphql', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    query: 'query LiveBinaryMarkets($where: Market_bool_exp) { Market(where: $where) { id } }',
    variables: { where: {} }
  })
}).then(r => r.text()).then(console.log).catch(console.error);
