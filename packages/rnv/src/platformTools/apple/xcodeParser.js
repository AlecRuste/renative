import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import {
    logTask,
    logError,
    logWarning,
    getAppFolder,
    isPlatformActive,
    logDebug,
    getAppVersion,
    getAppTitle,
    getEntryFile,
    writeCleanFile,
    getAppTemplateFolder,
    getAppId,
    getConfigProp,
    getIP,
    getBuildFilePath,
    logSuccess,
    getBuildsFolder
} from '../../common';
import { copyBuildsFolder } from '../../projectTools/projectParser'
import { IOS, TVOS } from '../../constants';
import { getMergedPlugin, parsePlugins } from '../../pluginTools';
import { getAppFolderName } from '../apple';
import { copyFolderContentsRecursiveSync, copyFileSync, mkdirSync, readObjectSync, mergeObjects } from '../../systemTools/fileutils';

const xcode = require('xcode');


export const parseXcodeProject = (c, platform) => new Promise((resolve, reject) => {
    // PROJECT
    const appFolder = getAppFolder(c, platform);
    const appFolderName = getAppFolderName(c, platform);
    const projectPath = path.join(appFolder, `${appFolderName}.xcodeproj/project.pbxproj`);
    const xcodeProj = xcode.project(projectPath);

    xcodeProj.parse(() => {
        const appId = getAppId(c, platform);

        const tId = getConfigProp(c, platform, 'teamID');
        if (tId) {
            xcodeProj.updateBuildProperty('DEVELOPMENT_TEAM', tId);
        } else {
            xcodeProj.updateBuildProperty('DEVELOPMENT_TEAM', '""');
        }
        const provisioningStyle = getConfigProp(c, platform, 'provisioningStyle', 'Automatic');
        xcodeProj.addTargetAttribute('ProvisioningStyle', provisioningStyle);
        xcodeProj.addBuildProperty('CODE_SIGN_STYLE', provisioningStyle);
        xcodeProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', appId);

        const deploymentTarget = getConfigProp(c, platform, 'deploymentTarget', '10.0');
        if (platform === IOS) {
            xcodeProj.updateBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', deploymentTarget);
        } else if (platform === TVOS) {
            xcodeProj.updateBuildProperty('TVOS_DEPLOYMENT_TARGET', deploymentTarget);
        }

        const provisionProfileSpecifier = getConfigProp(c, platform, 'provisionProfileSpecifier');
        if (provisionProfileSpecifier) {
            xcodeProj.updateBuildProperty('PROVISIONING_PROFILE_SPECIFIER', `"${provisionProfileSpecifier}"`);
        }

        const codeSignIdentity = getConfigProp(c, platform, 'codeSignIdentity');
        if (codeSignIdentity) {
            const runScheme = getConfigProp(c, platform, 'runScheme');
            const bc = xcodeProj.pbxXCBuildConfigurationSection();

            // xcodeProj.updateBuildProperty('CODE_SIGN_IDENTITY', `"${codeSignIdentity}"`, runScheme);
            // xcodeProj.updateBuildProperty('"CODE_SIGN_IDENTITY[sdk=iphoneos*]"', `"${codeSignIdentity}"`, runScheme);
            const cs1 = 'CODE_SIGN_IDENTITY';
            const cs2 = '"CODE_SIGN_IDENTITY[sdk=iphoneos*]"';
            for (const configName in bc) {
                const config = bc[configName];
                if ((runScheme && config.name === runScheme) || (!runScheme)) {
                    if (config.buildSettings[cs1]) config.buildSettings[cs1] = `"${codeSignIdentity}"`;
                    if (config.buildSettings[cs2]) config.buildSettings[cs2] = `"${codeSignIdentity}"`;
                }
            }
        }


        const systemCapabilities = getConfigProp(c, platform, 'systemCapabilities');
        if (systemCapabilities) {
            const sysCapObj = {};
            for (const sk in systemCapabilities) {
                const val = systemCapabilities[sk];
                sysCapObj[sk] = { enabled: val === true ? 1 : 0 };
            }
            // const var1 = xcodeProj.getFirstProject().firstProject.attributes.TargetAttributes['200132EF1F6BF9CF00450340'];
            xcodeProj.addTargetAttribute('SystemCapabilities', sysCapObj);
        }

        // FONTS
        c.pluginConfigiOS.embeddedFontSources.forEach((v) => {
            xcodeProj.addResourceFile(v);
        });


        // PLUGINS
        parsePlugins(c, platform, (plugin, pluginPlat, key) => {
            if (pluginPlat.xcodeproj) {
                if (pluginPlat.xcodeproj.resourceFiles) {
                    pluginPlat.xcodeproj.resourceFiles.forEach((v) => {
                        xcodeProj.addResourceFile(path.join(appFolder, v));
                    });
                }
                if (pluginPlat.xcodeproj.sourceFiles) {
                    pluginPlat.xcodeproj.sourceFiles.forEach((v) => {
                        // const group = xcodeProj.hash.project.objects.PBXGroup['200132F21F6BF9CF00450340'];
                        xcodeProj.addSourceFile(v, null, '200132F21F6BF9CF00450340');
                    });
                }
                if (pluginPlat.xcodeproj.headerFiles) {
                    pluginPlat.xcodeproj.headerFiles.forEach((v) => {
                        xcodeProj.addHeaderFile(v, null, '200132F21F6BF9CF00450340');
                    });
                }
                if (pluginPlat.xcodeproj.buildPhases) {
                    pluginPlat.xcodeproj.buildPhases.forEach((v) => {
                        xcodeProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'ShellScript', null, {
                            shellPath: v.shellPath || '/bin/sh',
                            shellScript: v.shellScript,
                            inputPaths: v.inputPaths || ['"$(SRCROOT)/$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)"']
                        });
                    });
                }
            }
        });

        fs.writeFileSync(projectPath, xcodeProj.writeSync());
        resolve();
    });
});


// export const parseXcodeProjec2() => new Promise((resolve, reject) => {
// const projectPath = path.join(appFolder, `${appFolderName}.xcodeproj/project.pbxproj`);
// const xcodeProj = xcode.project(projectPath);
// xcodeProj.parse(() => {
//     const appId = getAppId(c, platform);
//     if (tId) {
//         xcodeProj.updateBuildProperty('DEVELOPMENT_TEAM', tId);
//     } else {
//         xcodeProj.updateBuildProperty('DEVELOPMENT_TEAM', '""');
//     }
//
//     xcodeProj.addTargetAttribute('ProvisioningStyle', provisioningStyle);
//     xcodeProj.addBuildProperty('CODE_SIGN_STYLE', provisioningStyle);
//     xcodeProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', appId);
//
//     resolve();
// });
// })
