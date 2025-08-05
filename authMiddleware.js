import { auth } from '../config/firebase.js';

export const checkAuth = async (req, res, next) => {
  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    console.error('No token found');
    return res.status(401).send({ error: 'Unauthorized: No token provided.' });
  }

  try {
    // verifyIdToken() checks signature and expiration.
    const decodedToken = await auth.verifyIdToken(idToken);
    // Attach the entire decoded user object to the request for use in downstream functions.
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    return res.status(403).send({ error: 'Unauthorized: Invalid token.' });
  }
};