import {defineField, defineType} from 'sanity'
export const sourceDocument = defineType({
  name: 'sourceDocument', title: 'Official source', type: 'document',
  fields: [
    defineField({name:'title', type:'string', validation:r=>r.required()}),
    defineField({name:'slug', type:'slug', options:{source:'title'}, validation:r=>r.required()}),
    defineField({name:'authority', type:'string', validation:r=>r.required()}),
    defineField({name:'domain', type:'string', options:{list:['CPGRAMS','FASTag','DPDP','Passport','NHAI']}, validation:r=>r.required()}),
    defineField({name:'sourceType', type:'string', options:{list:['act','rules','guideline','faq','portal','policy','sop']}}),
    defineField({name:'officialUrl', type:'url', validation:r=>r.required()}),
    defineField({name:'publishedOn', type:'date'}),
    defineField({name:'effectiveFrom', type:'date'}),
    defineField({name:'version', type:'string'}),
    defineField({name:'supersedes', type:'reference', to:[{type:'sourceDocument'}]}),
    defineField({name:'jurisdiction', type:'string'}),
    defineField({name:'status', type:'string', options:{list:['current','superseded','draft','unclear']}, initialValue:'current'}),
    defineField({name:'summary', type:'text', rows:4}),
    defineField({name:'content', type:'array', of:[{type:'block'}], validation:r=>r.required()}),
    defineField({name:'procedures', type:'array', of:[{type:'procedure'}]}),
    defineField({name:'conflicts', type:'array', of:[{type:'conflict'}]}),
    defineField({name:'retrievedAt', type:'datetime'}),
    defineField({name:'contentHash', type:'string'})
  ],
  preview:{select:{title:'title', subtitle:'authority'}}
})
