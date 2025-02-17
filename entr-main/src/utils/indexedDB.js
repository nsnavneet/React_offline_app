import { openDB } from 'idb';
const DB_NAME = 'AppDB';
const DB_VERSION = 4;
const USER_STORE = 'users';
const PATIENT_STORE = 'patients';
const PENDING_UPLOAD_STORE = 'pendingUploads';
const PATIENT_UPLOADS_STORE = 'patientUploads';
export const generateUniqueKey = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};
// Initialize IndexedDB
export const initDB = async () => {
    try {
        const db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion) {
                console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);

                if (!db.objectStoreNames.contains(USER_STORE)) {
                    db.createObjectStore(USER_STORE, { keyPath: 'username' });
                }

                if (!db.objectStoreNames.contains(PATIENT_STORE)) {
                    db.createObjectStore(PATIENT_STORE, { keyPath: 'uhId' });
                }

                if (!db.objectStoreNames.contains(PENDING_UPLOAD_STORE)) {
                    db.createObjectStore(PENDING_UPLOAD_STORE, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(PATIENT_UPLOADS_STORE)) {
                    db.createObjectStore(PATIENT_UPLOADS_STORE, { keyPath: 'id', autoIncrement: true });
                }
            },
        });
        return db;
    } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
    }
};
// Clear all data from IndexedDB
export const clearDB = async () => {
    const db = await initDB();
    const storeNames = db.objectStoreNames;
    const tx = db.transaction(storeNames, 'readwrite');

    if (storeNames.contains(USER_STORE)) {
        await tx.objectStore(USER_STORE).clear();
    }
    if (storeNames.contains(PATIENT_STORE)) {
        await tx.objectStore(PATIENT_STORE).clear();
    }
    if (storeNames.contains(PENDING_UPLOAD_STORE)) {
        await tx.objectStore(PENDING_UPLOAD_STORE).clear();
    }
    if (storeNames.contains(PATIENT_UPLOADS_STORE)) {
        await tx.objectStore(PATIENT_UPLOADS_STORE).clear();
    }

    await tx.done;
};
// Save user login details (username + token)
export const saveUser = async (user) => {
    try {
        const db = await initDB();
        console.log("Saving user:", user); // Debugging log
        const tx = db.transaction(USER_STORE, 'readwrite');
        const store = tx.objectStore(USER_STORE);

        // Ensure user object contains a password
        if (!user.password) {
            throw new Error("Password is required to save user.");
        }

        // Add a flag to indicate the first successful login
        user.firstLogin = true;

        await store.put(user);  // Save user data
        await tx.done;

        console.log("User saved successfully in IndexedDB");
    } catch (error) {
        console.error("Error saving user to IndexedDB:", error);
    }
};


// Retrieve user details
export const getUser = async (username) => {
    const db = await initDB();
    const user = await db.get(USER_STORE, username);

    console.log("Retrieved user from IndexedDB:", user); // Debugging log

    return user;
};

// Get stored token
export const getToken = async () => {
    const db = await initDB();
    const users = await db.getAll(USER_STORE);
    return users.length > 0 ? users[0].token : null;
};

// Store patient data in IndexedDB
export const savePatientData = async (patients) => {
    const db = await initDB();

    // Ensure the object store exists
    if (!db.objectStoreNames.contains(PATIENT_STORE)) {
        console.error(`Object store "${PATIENT_STORE}" not found in IndexedDB.`);
        return;
    }

    const tx = db.transaction(PATIENT_STORE, 'readwrite');
    const store = tx.objectStore(PATIENT_STORE);

    await store.clear(); // Clear old data

    for (const patient of patients) {
        if (patient.uhId) {
            await store.put(patient);
        } else {
            console.warn('Skipping patient without uhId:', patient);
        }
    }

    await tx.done;
};

// Retrieve all patient data from IndexedDB
export const getPatientData = async () => {
    const db = await initDB();

    if (!db.objectStoreNames.contains(PATIENT_STORE)) {
        console.error(`Object store "${PATIENT_STORE}" not found.`);
        return [];
    }

    return await db.getAll(PATIENT_STORE);
};

export const savePendingUpload = async (uploadData) => {
    const db = await initDB();
    const storeNames = db.objectStoreNames;

    if (storeNames.contains(PENDING_UPLOAD_STORE)) {
        const tx = db.transaction(PENDING_UPLOAD_STORE, 'readwrite');
        const store = tx.objectStore(PENDING_UPLOAD_STORE);
        await store.add(uploadData);
        await tx.done;
        console.log('Pending upload saved to IndexedDB.');
    } else {
        console.warn(`Object store "${PENDING_UPLOAD_STORE}" not found.`);
    }
};

// Get all pending uploads
export const getPendingUploads = async () => {
    const db = await initDB();
    if (!db.objectStoreNames.contains(PENDING_UPLOAD_STORE)) {
        console.error(`Object store "${PENDING_UPLOAD_STORE}" not found.`);
        return [];
    }
    return await db.getAll(PENDING_UPLOAD_STORE);
};

// Remove a pending upload
export const removePendingUpload = async (id) => {
    const db = await initDB();
    const storeNames = db.objectStoreNames;

    // Check if the PENDING_UPLOAD_STORE exists
    if (storeNames.contains(PENDING_UPLOAD_STORE)) {
        const tx = db.transaction(PENDING_UPLOAD_STORE, 'readwrite');
        const store = tx.objectStore(PENDING_UPLOAD_STORE);
        await store.delete(id);
        await tx.done;
    } else {
        console.warn(`Object store "${PENDING_UPLOAD_STORE}" not found.`);
    }
};
export const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};
export const savePatientUpload = async (uploadData) => {
    console.log('Saving patient upload:', uploadData);
    const db = await initDB();
    const storeNames = db.objectStoreNames;

    if (storeNames.contains(PATIENT_UPLOADS_STORE)) {
        const tx = db.transaction(PATIENT_UPLOADS_STORE, 'readwrite');
        const store = tx.objectStore(PATIENT_UPLOADS_STORE);
        const dataWithId = { ...uploadData, id: generateUniqueId() };
        await store.put(dataWithId);
        await tx.done;
    } else {
        console.warn(`Object store "${PATIENT_UPLOADS_STORE}" not found.`);
    }
};
