'use client'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {contextPlugin} from '@sanity/context/studio'
import {schemaTypes} from './sanity/schemaTypes'
export default defineConfig({
  name: 'sarkari-agent', title: 'Sarkari Agent Knowledge Base',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'replace-me',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool(), visionTool(), contextPlugin()], schema: {types: schemaTypes}
})
