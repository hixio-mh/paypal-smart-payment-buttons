/* @flow */

import { noop } from 'belter';
import { jest } from 'jest';

import { getQRCodeMiddleware, cancelWatchers } from '../../server';

import { mockReq, mockRes } from './mock';

jest.setTimeout(300000);

afterAll(cancelWatchers);

const cache = {
    // eslint-disable-next-line no-unused-vars
    get: (key) => Promise.resolve(),
    set: (key, value) => Promise.resolve(value)
};

const logger = {
    debug: noop,
    info:  noop,
    warn:  noop,
    error: noop
};

const testQRpath = 'string_to_be_encoded';

function isRenderCallCorrect ({ html, qrPath, demo } : {|html : string, qrPath : string, demo : boolean|}) : boolean {
    /* eslint-disable prefer-regex-literals */
    const demoValue = demo.toString();
    const cspNonce_isCorrect = Boolean(html.match(RegExp(`renderQRCode.{"cspNonce":".*"`)));
    const qrPath_isCorrect = Boolean(html.match(RegExp(`renderQRCode.*,"qrPath":"${ qrPath }"`)));
    const demo_isCorrect = Boolean(html.match(RegExp(`renderQRCode.*,"demo":${ demoValue }}`)));
    return cspNonce_isCorrect && qrPath_isCorrect && demo_isCorrect;
    /* eslint-enable */
}

test('should do a basic QRCode page render', async () => {
    const qrCodeMiddleware = getQRCodeMiddleware({ logger, cache });

    const req = mockReq({
        query: {
            parentDomain: 'foo.paypal.com',
            qrPath:       testQRpath
        }
    });
    const res = mockRes();

    // $FlowFixMe
    await qrCodeMiddleware(req, res);

    const status = res.getStatus();
    const contentType = res.getHeader('content-type');
    const html = res.getBody();

    if (status !== 200) {
        throw new Error(`Expected response status to be 200, got ${ status }`);
    }

    if (contentType !== 'text/html') {
        throw new Error(`Expected content type to be text/html, got ${ contentType || 'undefined' }`);
    }

    if (!html) {
        throw new Error(`Expected res to have a body`);
    }

    if (!isRenderCallCorrect({ html, qrPath: testQRpath, demo: false })) {
        throw new Error(`Construction of the renderQRCode call is incorrect`);
    }
});

test('should fail if qrPath query param not provided', async () => {
    const qrCodeMiddleware = getQRCodeMiddleware({ logger, cache });

    const req = mockReq({
        query: {
            parentDomain: 'foo.paypal.com'
        }
    });
    const res = mockRes();

    // $FlowFixMe
    await qrCodeMiddleware(req, res);

    const status = res.getStatus();
    const contentType = res.getHeader('content-type');
    const body = res.getBody();

    if (status === 200) {
        throw new Error(`Expected response status to be 400, got ${ status }`);
    }

    if (contentType !== 'text/plain') {
        throw new Error(`Expected content type to be text/plain, got ${ contentType || 'undefined' }`);
    }

    if (!body) {
        throw new Error(`Expected res to have a body`);
    }
    
    if (body !== 'Please provide a qrPath query parameter') {
        throw new Error(`Expected body to be 'Please provide a qrPath query parameter', got ${ body || 'undefined ' }`);
    }
});

test('should fail with a non-paypal domain', async () => {
    const qrCodeMiddleware = getQRCodeMiddleware({ logger, cache });

    const req = mockReq({
        query: {
            parentDomain: 'haxpaypal.com'
        }
    });
    const res = mockRes();

    // $FlowFixMe
    await qrCodeMiddleware(req, res);

    const status = res.getStatus();
    const contentType = res.getHeader('content-type');
    const html = res.getBody();

    if (status !== 400) {
        throw new Error(`Expected response status to be 400, got ${ status }`);
    }

    if (contentType !== 'text/plain') {
        throw new Error(`Expected content type to be text/plain, got ${ contentType || 'undefined' }`);
    }

    if (!html) {
        throw new Error(`Expected res to have a body`);
    }
});

test('should render & make correct init call when when "demo" param passed', async () => {
    const qrCodeMiddleware = getQRCodeMiddleware({ logger, cache });

    const req = mockReq({
        query: {
            parentDomain: 'foo.paypal.com',
            qrPath:       testQRpath,
            demo:         'true'
        }
    });
    const res = mockRes();

    // $FlowFixMe
    await qrCodeMiddleware(req, res);

    const status = res.getStatus();
    const contentType = res.getHeader('content-type');
    const html = res.getBody();

    if (status !== 200) {
        throw new Error(`Expected response status to be 200, got ${ status }`);
    }

    if (contentType !== 'text/html') {
        throw new Error(`Expected content type to be text/html, got ${ contentType || 'undefined' }`);
    }

    if (!html) {
        throw new Error(`Expected res to have a body`);
    }

    if (!isRenderCallCorrect({ html, qrPath: testQRpath, demo: true })) {
        throw new Error(`Construction of the renderQRCode call is incorrect`);
    }
});
