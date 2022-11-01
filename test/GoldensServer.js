const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const http = require('http');
const busboy = require('busboy');

const wd = path.resolve(__dirname, '..');

/**
 * 
 * @param {http.IncomingMessage} req 
 * @returns 
 */
function parseRequest(req) {
    const bb = busboy({ headers: req.headers });
    return new Promise/*<{ files: Array<{ rawData: Buffer; } & busboy.FileInfo>; fields: { [key: string]: string | number; }; }>*/(resolve => {
        const files = []; //as Array<{ rawData: Buffer; } & busboy.FileInfo>;
        const fields = {};
        bb.on('file', (name, file, info) => {
            const raw = [];
            file.on('data', (data) => {
                raw.push(data);
            }).on('close', () => {
                files.push({ rawData: Buffer.concat(raw), ...info });
            });
        });
        bb.on('field', (name, value, info) => {
            fields[name] = value;
        });
        bb.on('close', () => {
            resolve({ files, fields });
        });
        req.pipe(bb);
    });
}

/**
 * handles updating/checking goldens from the browser
 */
function startGoldensServer() {
    const server = http
        .createServer(async (req, res) => {
            if (req.method.toUpperCase() === 'GET' && req.url === '/') {
                res.end('This endpoint is used by fabric.js and testem to generate goldens');
            }
            else if (req.method.toUpperCase() === 'GET') {
                const filename = req.url.split('/golden/')[1] || req.url;
                const goldenPath = path.resolve(wd, 'test', 'visual', 'golden', filename);
                res.end(JSON.stringify({ exists: fs.existsSync(goldenPath) }));
            }
            else if (req.method.toUpperCase() === 'POST' && req.url === '/goldens') {
                const { files: [{ rawData }], fields: { filename } } = await parseRequest(req);
                const fileName = filename.split('/golden/')[1];
                const goldenPath = path.resolve(wd, 'test', 'visual', 'golden', fileName);
                console.log(chalk.gray('[info]'), `creating golden ${path.relative(wd, goldenPath)}`);
                fs.writeFileSync(goldenPath, rawData, { encoding: 'binary' });
                res.end();
            }
            else if (req.method.toUpperCase() === 'POST' && req.url === '/goldens/results') {
                const { files, fields: { filename } } = await parseRequest(req);
                const fileName = /\/golden\/(.*)\..*$/.exec(filename)[1];
                const dumpsPath = path.resolve(wd, 'cli_output', 'test_results', 'visuals', fileName);
                !fs.existsSync(dumpsPath) && fs.mkdirSync(dumpsPath, { recursive: true });
                const out = { name: fileName, dir: dumpsPath };
                files.forEach(({ rawData, filename }) => {
                    const filePath = path.resolve(dumpsPath, filename);
                    fs.writeFileSync(filePath, rawData, { encoding: 'binary' });
                    out[path.basename(filePath, '.png')] = path.relative('.', filePath);
                });
                res.end(JSON.stringify(out));
            }
        }).listen();
    const port = server.address().port;
    const url = `http://localhost:${port}/`;
    server.on('listening', () => {
        console.log(chalk.yellow(`goldens server listening on ${url}`));
    });
    return { port, url };
}

exports.startGoldensServer = startGoldensServer;
