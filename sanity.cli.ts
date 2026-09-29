import {defineCliConfig} from 'sanity/cli'
export default defineCliConfig({api: {projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'replace-me', dataset: process.env.SANITY_STUDIO_DATASET || 'production'}, deployment: {appId: 'pi9m5l119j5fk7554gyb5ao1'}})
