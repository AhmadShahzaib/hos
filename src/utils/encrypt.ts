import * as crypto from 'crypto';
import * as util from 'util';

const password = 'Password used to generate key';
const salt = 'salt';

export async function encrypt(textToEncrypt) {
  textToEncrypt = JSON.stringify(textToEncrypt);
  const iv = crypto.randomBytes(16);

  const key = (await util.promisify(crypto.scrypt)(
    password,
    salt,
    32,
  )) as Buffer;
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);

  const encryptedText = Buffer.concat([
    cipher.update(textToEncrypt),
    cipher.final(),
  ]);

  return iv.toString('hex') + ':' + encryptedText.toString('hex');
}
