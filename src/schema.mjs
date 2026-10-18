/** Contract admission belongs to the Computer Data JSON Schema engine.
 * The four original public schema documents form one explicit closed graph;
 * a relative $ref is NEVER accepted merely because it points outside one
 * file. This module only supplies source files and the selected contract. */
import {readFileSync} from "node:fs";
import {schemaFromGraph} from "@red-cup-engineering/json-schema-services-section/contracts";

const names=["input","output","refusal","state"];
const source=new Map(names.map(name=>{
  const url=new URL("../content/schemas/"+name+".schema.json",import.meta.url);
  const schema=JSON.parse(readFileSync(url,"utf8"));
  if(typeof schema.$id!=="string")throw new TypeError("original schema lacks an $id: "+name);
  return [url.href,Object.freeze(schema)];
}));
const schemas=Object.freeze([...source.values()].map(schema=>
  Object.freeze({id:schema.$id,schema})));
const contracts=new Map();

/** Return exactly one original named source document; no arbitrary fallback. */
export function loadSchema(url) {
  const schema=source.get(url.href);
  if(!schema)throw new TypeError("unknown officer-context schema source: "+url.href);
  return schema;
}

/** Read the original closed schema graph through the Data-owned validator.
 * A nested or relative reference must resolve inside this same explicit set. */
export function assertSchema(value,selected,{field="$"}={}) {
  if(!schemas.some(({schema})=>schema===selected))
    throw new TypeError("officer-context schema is not one of the admitted original source documents");
  let contract=contracts.get(selected.$id);
  if(contract===undefined) {
    contract=schemaFromGraph({root:selected.$id,schemas});
    contracts.set(selected.$id,contract);
  }
  contract.assert(value,field);
}
