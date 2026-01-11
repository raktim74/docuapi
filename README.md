![Logo](https://github.com/raktim74/docuapi/blob/master/public/DocuAPI_logo.PNG)

# DocuAPI - API Documentation Portal

This platform will provide a centralised location to test and understand the respective APIs, eliminating the need for manual documentation, maintenance, and readability. It will also eliminate the API testing tool, which requires time spent importing collections, authorising requests, and so on. Additionally, it will offer a playground where you can check request and response without being overwhelmed by information


## Top Features

- Automatic authorization: You don’t need to worry about manual authorisation to get the JWT token. It has an access mechanism that allows you to log in and automatically authorise based on the members defined.
- Membership Access: This allows you to provide members with access to the portal for login.
- Disablement Of Execution: This feature allows you to disable specific APIs, even for viewing purposes, without allowing execution. For instance, if your API handles image uploads or file types, you can restrict its execution to prevent unnecessary files or images from being added to your destination


## Why Do You Go For This?

Developers generally maintain the Swagger file during project development and store it within the project. If you want to grant access, you can either provide the code with access or share the Swagger file along with the documentation (which could be in PDF, Word, Excel, etc.). Additionally, if the Swagger file resides in the production environment, it can consume some computational resources within the instance during debugging or testing. DocuAPI can be a solution to this issue, as it operates independently and maintains documentation in the same location


## Advantages

- API testing & documentation in one place
- Membership access via Login
- Execution control
- Auto Authorization For Defined Members
- Run In Local (Docker Image Available)


## Disadvantage

- Separate Hosting Instance (If Not Local)
- Hit Of API Endpoint (Target Instance)
- A Massive Amount Of Data In Response Could Potentially Cause A Browser Hang


## How It Works?

![Diagram](https://github.com/raktim74/docuapi/blob/master/public/DocuAPI_tech.drawio.svg)


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`NODE_ENV`: local/stg/production

`PORT`: 8080/8081/8082

`LOAD_OPTION`: json/yml

For Jest Testing, add .env.test file in the root directory

`NODE_ENV`: test jest

`LOAD_OPTION`=json/yml


## Run Locally

Clone the project
```bash
  git clone https://github.com/raktim74/docuapi.git
```

Install dependencies
```bash
  npm install
```
Start the server
```bash
  npm run start:local [refer package.json]
```


## Docker

- docker pull 0901224039/docuapi:v1
- docker run -p 9000:8080 0901224039/docuapi:v1 [Test locally]


## Authors

- [@raktim74](https://www.github.com/raktim74) Raktim Nath


## Credit

- Swagger UI


## License

[MIT](https://choosealicense.com/licenses/mit/)