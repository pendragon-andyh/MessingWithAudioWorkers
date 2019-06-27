export function interpolatedLookup(value, table) {
  if(value<0.0) {
    return table[0];
  }
  if(value>table.length-1) {
    return table[table.length-1];
  }
  const index=value|0;
  const factor=(value-index);
  return (table[index]*(1.0-factor))+(table[index+1]*factor);
}
