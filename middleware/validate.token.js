const JSON_TOKEN = require('jsonwebtoken');

async function encodeToken(username){
    return JSON_TOKEN.sign({username: username}, 'api_doc_swagger', {expiresIn: '1h'})
}

async function decodeToken(token_cookie) {
    return JSON_TOKEN.decode(token_cookie);
}

module.exports = {
    encodeToken,
    decodeToken
}