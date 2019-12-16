## Ionic Starter for Frappe

- Uses frappe's OAuth2 for authorization
- Seamless session refresh with refresh token (for offline abilities)
- Uses Ionic/Angular
- Uses native http calls instead of cordova/browser calls to circumvent CORS
- Minimum Unit tests and E2E tests to ensure API functionality and upgrades

#### Code Description:

`StorageService` :

- uses localStorage, replace with secure storage for production. Storage can be async.
- It emits changes in localStorage, can be subscribed from anywhere in app to change app behaviour.
- Watch for `loggedIn` key, use `LOGGED_IN` constant

`TokenService` :

- `initializeCodeGrant()` : used to initialize auth code flow using `InAppBrowser`, watches for callback and completes the code flow.
- `getToken()` : get active token for use (returns RxJs Observable), use with `HttpClient` Observable.
- `revokeToken()`: revokes current access token from frappe server.

`CallbackComponent` :

- On mobile, the app uses `InAppBrowser` to initialize and process oauth 2 code grant, this does not work in development browser. For that `CallbackComponent` is added. It catches code and state for further process.

#### Configuring App:

- Refer `AppComponent`
- Set urls and oauth 2 config in `OAuthProviderClientCredentials` object.
- Login : tokenService.initializeCodeGrant() > subscribe and watch for `LOGGED_IN` > refresh cordova window > read `LOGGED_IN` and update UI
- Logout : tokenService.revokeToken() > clear tokens and `LOGGED_IN` > refresh cordova window > read `LOGGED_IN` and update UI

#### Bootstrap development

- nvm (recommended)
- ionic `npm i -g ionic`

```sh
npm i

# development
ionic cordova run android --device -l --debug
```

Note:

- To avoid Frappe CORS Issue, the HTTP requests are made using native calls.
- App does not work in browser

#### VS Code Configuration

Note: App catches custom url `frappe://` it cannot be emulated in browser.

`launch.json` file, replace as per your operating system:

```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "ionic serve",
            "url": "http://localhost:8100",
            "runtimeExecutable": "/usr/bin/chromium",
            "runtimeArgs": [
                "--disable-web-security",
                "--remote-debugging-port=9222",
                "--user-data-dir=/tmp/nocors"
            ],
            "webRoot": "${workspaceFolder}"
        }
    ]
}
```

#### Format code, Lint code and run tests

```sh
# Lint Code
npm run lint -- --fix

# Format Code
npm run format

# Run unit tests
npm run test

# Run e2e tests
npm run e2e
```

#### Dependency Upgrades

Install npm-check `npm i -g npm-check` and execute command from project root directory.

```sh
npm-check --update .
```

Upgrade the dependency versions using the npm-check menu, it will update `package.json` and lock file.

Run tests to identify breaking changes and refactor accordingly.
