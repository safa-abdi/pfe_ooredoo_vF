/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/polyfills.ts
import * as crypto from 'crypto';
global.crypto = crypto as any;