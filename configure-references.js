#!/usr/bin/env node

// @ts-check
/* eslint-disable */

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const isCI = require('is-ci');

const loadConfig = (path) => {
    const content = fs.readFileSync(path).toString();
  
    // strip comments
    const data = content.replace(
      /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
      (m, g) => (g ? '' : m),
    );
  
    return JSON.parse(data);
};

const config = loadConfig('tsconfig.json');
config.files = [];
config.references = [];

(async function() {
    if (isCI) {
        // dont run it on CI
        return;
    }

    const { stdout, stderr } = await exec('yarn workspaces info --json');

    const lines = stdout.split('\n');
    const depthTree = lines.slice(1, lines.length - 2).join('\n');
    const workspaces = JSON.parse(depthTree);

    for (const name in workspaces) {
        const workspace = workspaces[name];
        const location = path.resolve(process.cwd(), workspace.location);
        const tsconfigPath = path.resolve(location, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
            config.references.push({
                path: workspace.location,
            });
            const workspaceConfig = loadConfig(tsconfigPath);
            workspaceConfig.compilerOptions.composite = true;
            workspaceConfig.references = [];
            for (const dependency of workspace.workspaceDependencies) {
                const dependecyLocation = path.resolve(
                    process.cwd(),
                    workspaces[dependency].location,
                );
                if (
                    fs.existsSync(
                        path.resolve(dependecyLocation, 'tsconfig.json'),
                    )
                ) {
                    workspaceConfig.references.push({
                        path: path.relative(location, dependecyLocation),
                    });
                }
            }
            fs.writeFileSync(
                tsconfigPath,
                JSON.stringify(workspaceConfig, undefined, 4),
            );
        }
    }
    fs.writeFileSync('tsconfig.json', JSON.stringify(config, undefined, 4));
})();
