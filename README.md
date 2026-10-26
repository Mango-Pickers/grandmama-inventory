# My Grandma's Kitchen

Responsive inventory operations application for My Grandma's Kitchen. Product requirements and delivery acceptance criteria are documented in [spec.md](spec.md).

## Local Development

Prerequisites: Node.js and npm.

```sh
npm install
npm run dev
```

Vite loads Firebase settings from `.env.local`. That file is ignored by Git. Copy `.env.example` to `.env.local`, fill in your Firebase web app values, and restart the dev server after changing them. In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Run tests and build for production:

```sh
npm test
npm run build
```

## Firebase Setup

1. In the Firebase Console, select or create the `grandmama-inventory` project.
2. Register a Web app in Project settings and copy its web configuration values.
3. In Authentication, enable the Email/Password sign-in provider and manually add the four approved accounts listed below. There is no public sign-up or role selector.
4. Create a Cloud Firestore database in the intended region. Cloud Firestore is the application's database; Firebase Authentication is used only for identity and sign-in.
5. Copy `.env.example` to `.env.local` and set the variables listed below. The Firebase web configuration supplied for this project is already in this workspace's ignored `.env.local` file.
6. Restart the Vite dev server.

| Environment variable | Firebase web configuration field |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional Analytics `measurementId` |

Create these users in Firebase Console under Authentication → Users → Add user. Set or rotate each password in Firebase Console; passwords are never seeded in application source or committed to Git:

| Role | Login email |
| --- | --- |
| Inventory Officer | `inventory@mygrandmama.com` |
| Manager | `manager@mygrandmama.com` |
| Administrator | `admin@mygrandmama.com` |
| Supervisor | `supervisor@mygrandmama.com` |

The reusable client module is [src/lib/firebase.ts](src/lib/firebase.ts). It initializes the Firebase app, Authentication, and Cloud Firestore when required configuration is present. Analytics is loaded only in a browser and only when Firebase reports it is supported. When required configuration is missing, the module exposes `firebaseConfigError` with the missing variable names. The app accepts only the four allowlisted emails in [src/lib/authorized-users.ts](src/lib/authorized-users.ts), shows an access-denied state for other Firebase accounts, and displays the mapped role in the app header. All four approved accounts have the same application permissions; role labels are descriptive and do not restrict features.

Firebase web configuration is available to frontend users and is not an authorization mechanism. Do not put Firebase Admin credentials, passwords, or other privileged secrets in `VITE_` variables. Protect Firestore with [firestore.rules](firestore.rules), which independently allows all four approved email addresses. The allowlist in the app only controls its sign-in experience; Firestore rules are the data security boundary. If adding or changing staff, update both the rules and the app allowlist, then deploy the rules.

## Current Integration Status

Firebase email/password sign-in, four-account access allowlist, and Cloud Firestore client setup are implemented. Inventory loads catalogue records from `inventoryItems` and `stockVariants`; a one-time action adds the products and explicit variants from `spec.md` using namespaced stable IDs. It preserves existing documents and does not create stock quantities or opening balances. CSV / Excel catalogue import and export also use these collections. Deploy the current Firestore rules before using catalogue seeding or imports. Other operational screens remain empty foundations and transaction/report imports and exports are not yet implemented.

Deploy the version-controlled Firestore rules and indexes after signing in to Firebase CLI and confirming the selected project:

```sh
npx firebase-tools login
npx firebase-tools use grandmama-inventory
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

## Netlify Deployment

Build with `npm run build`. The Vite client output is generated under `.output/public` by the current TanStack Start/Nitro configuration; verify the configured Netlify adapter and publish directory against the deployment target before publishing. Set the Firebase environment variables in the Netlify build environment, including `VITE_FIREBASE_MEASUREMENT_ID` when Analytics is desired. Never add Admin credentials to frontend build variables.

The app uses TanStack Router. Ensure the chosen Netlify deployment configuration provides the required route handling for client-side paths. Firestore rules and indexes must be deployed separately with Firebase CLI after their version-controlled configuration is added; never deploy unrestricted rules.