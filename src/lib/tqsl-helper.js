// src/lib/tqsl-helper.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { decryptP12Data, decryptP12Password } from './crypto';
import { logInfo, logError, logWarn } from './logger';

const execAsync = promisify(exec);
const mkdir = fs.mkdir;
const writeFile = fs.writeFile;
const unlink = fs.unlink;
const rm = fs.rm;

/**
 * 验证 .p12 文件密码并解析呼号
 * 支持无密码证书
 * @param {Buffer} p12Buffer - .p12 文件内容
 * @param {string} password - 用户输入的密码（可能为空）
 * @returns {Promise<{ valid: boolean, callsign: string, hasPassword: boolean, error?: string }>}
 */
export async function verifyP12AndGetCallsign(p12Buffer, password) {
    const tempDir = path.join(os.tmpdir(), 'p12-verify-' + Date.now());
    await mkdir(tempDir, { recursive: true });
    const p12Path = path.join(tempDir, 'test.p12');
    await writeFile(p12Path, p12Buffer);

    let hasPassword = false;
    let callsign = '';
    try {
        // 先尝试空密码
        try {
            const { stdout } = await execAsync(
                `openssl pkcs12 -in "${p12Path}" -nokeys -passin pass:''`
            );
            // 空密码成功 -> 证书无密码
            hasPassword = false;
            const match = stdout.match(/CN=([^,\s]+)/);
            if (match) callsign = match[1];
            else throw new Error('无法解析呼号');
        } catch (err) {
            // 空密码失败 -> 证书有密码
            hasPassword = true;
            if (!password || password.trim() === '') {
                throw new Error('证书有密码，请填写密码');
            }
            // 验证用户密码
            const { stdout } = await execAsync(
                `openssl pkcs12 -in "${p12Path}" -nokeys -passin pass:${password}`
            );
            const match = stdout.match(/CN=([^,\s]+)/);
            if (match) callsign = match[1];
            else throw new Error('无法解析呼号');
        }
        return { valid: true, callsign, hasPassword };
    } catch (err) {
        logWarn('证书验证失败', err.message);
        return { valid: false, callsign: '', error: err.message };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

export async function prepareTQSLDirectory(config, stationLocations = []) {
    if (config.expires_at && new Date(config.expires_at) < new Date()) {
        throw new Error('LoTW配置已过期，请重新上传证书');
    }

    const tempDir = path.join(os.tmpdir(), 'tqsl-' + Date.now());
    await mkdir(tempDir, { recursive: true });

    try {
        const p12Buffer = decryptP12Data(config.p12_data, config.p12_iv, config.p12_tag);
        const password = decryptP12Password(
            config.p12_password_enc,
            config.p12_password_iv,
            config.p12_password_tag
        ).toString('utf-8');

        const p12Path = path.join(tempDir, 'callsign.p12');
        await writeFile(p12Path, p12Buffer);

        const env = { ...process.env, TQSL_HOME: tempDir };
        const importCmd = `echo "${password}" | tqsl -i "${p12Path}"`;
        await execAsync(importCmd, { env });
        await unlink(p12Path);

        for (const station of stationLocations) {
            let cmd = `tqsl -a -n "${station.name}" -d ${station.dxcc} -g ${station.grid} -i ${station.itu} -z ${station.cqz}`;
            if (station.iota) cmd += ` -o ${station.iota}`;
            await execAsync(cmd, { env });
        }

        return { configDir: tempDir, callsign: config.cert_callsign };
    } catch (err) {
        logError('TQSL目录准备失败', err);
        await rm(tempDir, { recursive: true, force: true });
        throw err;
    }
}

export async function uploadADIFWithTQSL(adifContent, configDir, stationName) {
    const tempDir = path.join(os.tmpdir(), 'qso-upload-' + Date.now());
    await mkdir(tempDir, { recursive: true });
    const adifPath = path.join(tempDir, 'upload.adi');
    await writeFile(adifPath, adifContent, 'utf-8');

    const env = { ...process.env, TQSL_HOME: configDir };
    let cmd = `tqsl -a compliant -l "${stationName}" -u -x "${adifPath}"`;
    try {
        const { stdout, stderr } = await execAsync(cmd, { env, timeout: 120000 });
        const output = stdout + stderr;
        const recordMatch = output.match(/Attempting to upload (\d+) QSOs?/i);
        const recordCount = recordMatch ? parseInt(recordMatch[1], 10) : 0;
        const success = output.includes('Final Status: Success') || output.includes('upload completed');
        return { success, output, recordCount };
    } catch (error) {
        logError('TQSL上传失败', error);
        return { success: false, output: error.stderr || error.message, recordCount: 0 };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

export async function cleanupTQSLDirectory(configDir) {
    if (!configDir || configDir.length < 10 || !configDir.startsWith(os.tmpdir())) {
        return;
    }
    try {
        await rm(configDir, { recursive: true, force: true });
    } catch (err) {
        logWarn('清理TQSL目录失败', err.message);
    }
}