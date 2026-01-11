/**
 * Package Imports
 */
const EXPRESS = require('express');
const SWAGGER_UI = require('swagger-ui-express');
const _COOKIE_PARSER = require('cookie-parser');
const DOTNEV = require('dotenv');
const PICK_ENV = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
const FS = require('fs');
const PATH = require('path')
const SWAGGER_YAML = require('js-yaml');
const CONFIG = require('./config');
const VALIDATE_TOKEN = require('./middleware/validate.token');
const swaggerPath = process.env.LOAD_OPTION || 'json';

// Environments Assignments
DOTNEV.config({ path: PICK_ENV });


// Express Server Assignment
const APP_STARTER = EXPRESS();
APP_STARTER.use(_COOKIE_PARSER());
APP_STARTER.use(EXPRESS.static("public"));


//Variable Declaration; You Need To Use DB or SSO For Login
let login_user = {
    "username": "abc@xyz.com",
    "password": "123456"
}


/**
 * Loads The Swagger Specification Based On The API URL Based On The Corresponding JSON Created Under The Swagger JSON Dir If LOAD_OPTION Is JSON Otherwise It Is YML
 * The Filename Must Follow The Pattern: `<url>-swagger.json` Or `<url>-swagger.yml`
 * 
 * @param {string} url - The API Identifier (eg. "api1", "api2") 
 * @returns {object|null} If Swagger Specification Is Found Otherwise `null`
 */
function get_swagger_specs(url) {
    let swagger_parser = "";
    const URL_DEF = CONFIG.config.url_def;
    try {
        if (URL_DEF.includes(url)) {
            if (swaggerPath == 'json') {
                swagger_parser = JSON.parse(FS.readFileSync(PATH.join(__dirname, `swagger-${swaggerPath}`, `${url}-swagger.${swaggerPath}`)));
            } else {
                swagger_parser = SWAGGER_YAML.load(FS.readFileSync(PATH.join(__dirname, `swagger-${swaggerPath}`, `${url}-swagger.${swaggerPath}`), 'utf-8'));
            }
            return swagger_parser;
        }
    } catch (ex) {
        console.log("Exception Occured", ex);
    }

    return null;
}


//Get The JWT Token From The Cookie
const GET_COOKIE = async (req, res) => {
    return req.cookies['authToken'];
}


//Serving the Swagger UI At Root 
//DO NOT USE GET FOR LOGIN; IT MUST BE POST
APP_STARTER.use('/docs/:api_url', SWAGGER_UI.serve);
APP_STARTER.get('/', (req, res) => {
    res.send(`
      <html>
      <head>
      <title>DocuAPI</title>
      <link rel="stylesheet" href="/style.css">
      <link rel="icon" type="image/png" href="DocuAPI_icon.png">
      </head>
      <body>
      <form action="/docs" method="GET">
        <img src="./DocuAPI_logo.PNG" height="150" width="200">
        <p>DEMO REPRESENTATION</p>
        <input type="text" name="username" placeholder="Username" required value="abc@xyz.com" /><br><br>
        <input type="password" name="password" placeholder="Password" required value="123456" /><br><br>
        <button type="submit">Login</button>
        <p>SSO IS NOT AVAILABLE AT THIS MOMENT</p>
      </form>
      </body>
      </html>    
    `);

});


//After Login, Redirect To docs URL & Authorize + Set Cookie
APP_STARTER.get('/docs', async (req, res) => {
    if (req.query.username != login_user.username || req.query.password != login_user.password) {
        res.send("Unauthorized !! Either username or password is wrong");
        return
    }
    const _TOKEN = await VALIDATE_TOKEN.encodeToken(req.query.username,)
    if (_TOKEN) {
        res.cookie('authToken', `${_TOKEN}`, { maxAge: 86400, httpOnly: true });
    }
    let api_cards = "";
    //Read From Respective LOAD OPTION Swagger Folder & Pull The First Name Which Is API NAME
    const API_FILES = FS.readdirSync(PATH.join(__dirname, `swagger-${swaggerPath}`));
    API_FILES.forEach((api_swagger) => {
        api_cards += `<div class="card"><a href="/docs/${api_swagger.split('-')[0]}">${api_swagger.split('-')[0].toUpperCase()}</a></div>`
    })
    res.send(`
    <html>
      <head>
        <title>DocuAPI - Documenting API</title>
        <link rel="stylesheet" href="/style.css">
        <link rel="icon" type="image/png" href="DocuAPI_icon.png">
      </head>
      <body>
        <div class="page-container">
          <h1>DocuAPI</h1>
          <div class="grid">
            ${api_cards}
          </div>
        </div>
      </body>
    </html>
  `);
});


/**
 * GET API
 * Passing The API Name In The URL And Loading The Respective API Specification
 * Checks For JWT Token Pulled From Cookie
 * Based On The Defined Members Accessibility, The Auto Authorization Takes Place
 * Based On The Nature Of The API, The Try Out Option Is Enabled/Disabled 
 */
APP_STARTER.get('/docs/:api_url', async (req, res, next) => {
    const SPECS = get_swagger_specs(req.params.api_url);
    if (!SPECS) return res.status(404).send('Swagger is not found!!');
    const TOKEN_COOKIE = await GET_COOKIE(req);
    let decode_token;
    let email_id;
    let swagger_ui_options;
    try {
        let eligible_api = CONFIG.config.enable_req_call;
        if (TOKEN_COOKIE != undefined) {
            decode_token = await VALIDATE_TOKEN.decodeToken(TOKEN_COOKIE);
            email_id = decode_token[CONFIG.config.jwt_identity_key];
            if (eligible_api.includes(req.params.api_url)) {
                swagger_ui_options = {
                    swaggerOptions: {
                        authAction: {
                            bearerAction: {
                                name: "bearerAuth",
                                schema: {
                                    type: "http",
                                    in: "header",
                                    name: "Authorization",
                                    scheme: "",
                                    bearerFormat: "JWT"
                                },
                                value: 'Bearer ' + TOKEN_COOKIE
                            }
                        }
                    }
                };
            } else {
                swagger_ui_options = {
                    swaggerOptions: {
                        customCss: '.swagger-ui .try-out { display: none }', //supportedSubmitMethods: [], does not work with swagger-ui-express ^5.0.1 and swagger-jsdoc ^6.2.8
                        authAction: {
                            bearerAction: {
                                name: "bearerAuth",
                                schema: {
                                    type: "http",
                                    in: "header",
                                    name: "Authorization",
                                    scheme: "",
                                    bearerFormat: "JWT"
                                },
                                value: 'Bearer ' + TOKEN_COOKIE
                            }
                        }
                    }
                };
            }
        } else {
            if (eligible_api.includes(req.params.api_url)) {
                swagger_ui_options = {
                    swaggerOptions: {

                    }
                };
            } else {
                swagger_ui_options = {
                    customCss: '.swagger-ui .try-out { display: none }', //supportedSubmitMethods: [], does not work with swagger-ui-express ^5.0.1 and swagger-jsdoc ^6.2.8
                };
            }
        }
    } catch (ex) {
        swagger_ui_options = {
            customCss: '.swagger-ui .try-out { display: none }', //supportedSubmitMethods: [], does not work with swagger-ui-express ^5.0.1 and swagger-jsdoc ^6.2.8
        };
        console.log("Exception Occurred: ", ex)
    }
    if (TOKEN_COOKIE) {
        const ACCESS_MEMBER = CONFIG.config.access_member;
        if (ACCESS_MEMBER.includes(email_id)) {
            SWAGGER_UI.setup(SPECS, swagger_ui_options)(req, res, next);
        } else {
            SWAGGER_UI.setup(SPECS)(req, res, next);
        }
    } else {
        SWAGGER_UI.setup(SPECS, swagger_ui_options)(req, res, next);
    }
});


/**
 * It Starts The Server Based On PORT Passed In The Param
 * 
 * @param {integer} port - This PORT Will Be Picked From Environment 
 * @returns {object|null} If Sever Starts Successfull Otherwise null
 */
function start_server(port = process.env.PORT) {
    const SERVER = APP_STARTER.listen(port, () => {
        console.log(`Sever Running On Port: ${process.env.PORT}`)
    });
    return SERVER || null;
}


//To Avoid Open Handle Error From Jest, Use The Check Against NODE_ENV
if (process.env.NODE_ENV != 'test') {
    const port = process.env.PORT || 8080;
    start_server(port);
}


//Export The Entities To Be Used By Other Files
module.exports = {
    get_swagger_specs,
    APP_STARTER,
    start_server
}