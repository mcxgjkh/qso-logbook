// src/lib/tqsl-helper.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { decryptP12Data, decryptP12Password } from './crypto';

const execAsync = promisify(exec);
const mkdir = fs.mkdir;
const writeFile = fs.writeFile;
const unlink = fs.unlink;
const rm = fs.rm;
const readFile = fs.readFile;

/**
 * 验证 .p12 文件密码并解析呼号
 * @param {Buffer} p12Buffer - .p12 文件内容
 * @param {string} password - 密码
 * @returns {Promise<{ valid: boolean, callsign: string, error?: string }>}
 */
export async function verifyP12AndGetCallsign(p12Buffer, password) {
    const tempDir = path.join(os.tmpdir(), 'p12-verify-' + Date.now());
    await mkdir(tempDir, { recursive: true });
    const p12Path = path.join(tempDir, 'test.p12');
    await writeFile(p12Path, p12Buffer);

    try {
        // 使用 openssl 检查
        const { stdout } = await execAsync(
            `openssl pkcs12 -in "${p12Path}" -nokeys -passin pass:${password}`
        );
        // 解析呼号
        const match = stdout.match(/CN=([^,\s]+)/);
        if (!match) throw new Error('无法解析呼号');
        return { valid: true, callsign: match[1] };
    } catch (err) {
        return { valid: false, callsign: '', error: '密码错误或证书无效' };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

/**
 * 准备 TQSL 配置目录（导入证书并设置台站）
 * @param {Object} config - 从数据库获取的配置行
 * @param {Array} stationLocations - 台站位置列表
 * @returns {Promise<{ configDir: string, callsign: string }>}
 */
export async function prepareTQSLDirectory(config, stationLocations = []) {
    // 检查配置是否过期
    if (config.expires_at && new Date(config.expires_at) < new Date()) {
        throw new Error('LoTW配置已过期，请重新上传证书');
    }
    const tempDir = path.join(os.tmpdir(), 'tqsl-' + Date.now());
    await mkdir(tempDir, { recursive: true });

    // 1. 解密 p12 和密码
    const p12Buffer = decryptP12Data(config.p12_data, config.p12_iv, config.p12_tag);
    const password = decryptP12Password(
        config.p12_password_enc,
        config.p12_password_iv,
        config.p12_password_tag
    ).toString('utf-8');

    // 2. 写入临时 p12
    const p12Path = path.join(tempDir, 'callsign.p12');
    await writeFile(p12Path, p12Buffer);

    // 3. 导入证书到 TQSL（使用临时目录作为 HOME）
    const env = { ...process.env, TQSL_HOME: tempDir };
    const importCmd = `echo "${password}" | tqsl -i "${p12Path}"`;
    await execAsync(importCmd, { env });

    // 4. 删除临时 p12
    await unlink(p12Path);

    // 5. 为每个台站添加位置
    for (const station of stationLocations) {
        let cmd = `tqsl -a -n "${station.name}" -d ${station.dxcc} -g ${station.grid} -i ${station.itu} -z ${station.cqz}`;
        if (station.iota) cmd += ` -o ${station.iota}`;
        if (station.default) cmd += ' -s'; // 设为默认？TQSL 没有 -s 参数，我们用 -l 指定默认位置。
        // 实际上我们不需要显式设置默认，上传时可以指定 -l 参数。
        await execAsync(cmd, { env });
    }

    // 6. 返回配置目录
    return { configDir: tempDir, callsign: config.cert_callsign };
}

/**
 * 上传 ADIF 到 LoTW
 * @param {string} adifContent - ADIF 内容
 * @param {string} configDir - TQSL 配置目录
 * @param {string} stationName - 台站名称（必须与添加时一致）
 * @returns {Promise<{ success: boolean, output: string, recordCount: number }>}
 */
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
        return { success: false, output: error.stderr || error.message, recordCount: 0 };
    } finally {
        await rm(tempDir, { recursive: true, force: true });
        // 注意：不要删除 configDir，因为可能被后续使用。调用者负责清理。
    }
}

/**
 * 清理 TQSL 配置目录
 */
export async function cleanupTQSLDirectory(configDir) {
    if (!configDir || configDir.length < 10 || !configDir.startsWith(os.tmpdir())) {
        return;
    }
    try {
        await rm(configDir, { recursive: true, force: true });
    } catch {}
}