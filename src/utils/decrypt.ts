import * as crypto from 'crypto';
import * as util from 'util';

const password = 'Password used to generate key';
const salt = 'salt';

export async function decrypt(encryptedText) {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = (await util.promisify(crypto.scrypt)(
    password,
    salt,
    32,
  )) as Buffer;
  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);

  const decryptedText = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return JSON.parse(decryptedText.toString());
}
