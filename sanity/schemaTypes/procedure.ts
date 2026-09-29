import {defineType} from 'sanity'
export const procedure = defineType({name:'procedure', title:'Procedure', type:'object', fields:[
  {name:'issue', type:'string'}, {name:'eligibility', type:'text'},
  {name:'steps', type:'array', of:[{type:'object', fields:[{name:'order',type:'number'},{name:'action',type:'text'},{name:'channel',type:'string'},{name:'evidence',type:'array',of:[{type:'string'}]},{name:'deadline',type:'string'}]}]},
  {name:'escalation', type:'text'}, {name:'fees', type:'string'}, {name:'exclusions', type:'array', of:[{type:'string'}]}
]})
