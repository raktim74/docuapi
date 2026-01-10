let config = {
    "access_member": ['abac@xyz.com', 'sss@sss.com'],
    "enable_req_call": ['api1', 'api2'],
    "jwt_identity_key": "username", //This Will Be Your Encrypted Key By Which You Are Identifying The Authorized User From JWT Token
    "url_def": ['api1', 'api2', 'api3']
}

module.exports ={
    config
}