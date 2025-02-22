/* eslint-disable import/no-cycle */
import chalk from 'chalk';
import path from 'path';
import inquirer from 'inquirer';
import {
    isPlatformSupportedSync, getConfig, logTask, logComplete, logError,
    getAppFolder, isPlatformSupported, checkSdk
} from '../common';
import PlatformSetup from '../setupTools';
import { IOS, ANDROID, TVOS, TIZEN, WEBOS, ANDROID_TV, ANDROID_WEAR, KAIOS, CLI_ANDROID_ADB, CLI_ANDROID_AVDMANAGER, CLI_ANDROID_EMULATOR, CLI_ANDROID_SDKMANAGER } from '../constants';
import { launchTizenSimulator } from './tizen';
import { launchWebOSimulator, listWebOSTargets } from './webos';
import { listAndroidTargets, launchAndroidSimulator } from './android/deviceManager';
import { listAppleDevices, launchAppleSimulator } from './apple';
import { launchKaiOSSimulator } from './firefox';

export const rnvTargetLaunch = async (c) => {
    logTask('_runLaunch');

    await isPlatformSupported(c);

    const { platform, program } = c;
    const target = program.target || c.files.workspace.config.defaultTargets[platform];

    switch (platform) {
    case ANDROID:
    case ANDROID_TV:
    case ANDROID_WEAR:
        launchAndroidSimulator(c, platform, target)
            .then(() => resolve())
            .catch(e => reject(e));
        return;
    case IOS:
    case TVOS:
        launchAppleSimulator(c, platform, target)
            .then(() => resolve())
            .catch(e => reject(e));
        return;
    case TIZEN:
        launchTizenSimulator(c, target)
            .then(() => resolve())
            .catch(e => reject(e));
        return;
    case WEBOS:
        launchWebOSimulator(c, target)
            .then(() => resolve())
            .catch(e => reject(e));
        return;
    case KAIOS:
        launchKaiOSSimulator(c, target)
            .then(() => resolve())
            .catch(e => reject(e));
        return;
    default:
        return Promise.reject(
            `"target launch" command does not support ${chalk.white.bold(
                platform
            )} platform yet. You will have to launch the emulator manually. Working on it!`
        );
    }
};

export const rnvTargetList = async (c) => {
    logTask('rnvTargetList');

    await isPlatformSupported(c);

    const { platform } = c;

    const throwError = (err) => {
        throw err;
    };

    switch (platform) {
    case ANDROID:
    case ANDROID_TV:
    case ANDROID_WEAR:
        if (!checkSdk(c, platform, logError)) {
            const setupInstance = PlatformSetup(c);
            await setupInstance.askToInstallSDK('android');
        }
        return listAndroidTargets(c, platform);
    case IOS:
    case TVOS:
        return listAppleDevices(c, platform);
    case WEBOS:
        if (!checkSdk(c, platform, throwError)) return;
        return listWebOSTargets(c);
    default:
        throw `"target list" command does not support ${chalk.white.bold(platform)} platform yet. Working on it!`;
    }
};
