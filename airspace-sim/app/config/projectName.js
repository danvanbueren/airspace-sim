import packageJson from '../../package.json' with { type: 'json' }

/** Program name sourced from package.json. */
export const PROJECT_NAME = packageJson.name

export default PROJECT_NAME
