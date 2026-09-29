import {defineType} from 'sanity'
export const conflict = defineType({name:'conflict', title:'Source conflict', type:'object', fields:[
  {name:'topic',type:'string'}, {name:'otherSource',type:'reference',to:[{type:'sourceDocument'}]},
  {name:'thisClaim',type:'text'}, {name:'otherClaim',type:'text'},
  {name:'resolution',type:'text'}, {name:'confidence',type:'string',options:{list:['high','medium','low']}}
]})
