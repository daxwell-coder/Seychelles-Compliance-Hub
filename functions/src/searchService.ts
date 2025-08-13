import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { 
  searchByFullName, 
  searchByNationalId, 
  searchByTaxId, 
  searchByAddress, 
  searchByClientName,
  universalSearch,
  getClientDetails,
  SearchOptions
} from './encryptedDataSearch';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function for searching encrypted PII data
 * 
 * Provides secure search capabilities across encrypted fields using searchable hashes.
 * Requires proper authentication and authorization in production.
 */
export const searchEncryptedData = onRequest({ 
  cors: true,
  invoker: 'private' // Restrict access in production
}, async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2);

  try {
    // Basic request validation
    if (req.method !== 'POST') {
      res.status(405).json({ 
        error: 'Method not allowed', 
        message: 'Only POST requests are supported' 
      });
      return;
    }

    // API Key authentication (if configured)
    const expectedKey = process.env.SEARCH_API_KEY;
    if (expectedKey) {
      const providedKey = req.headers['x-api-key'] as string || req.query.api_key as string;
      if (!providedKey || providedKey !== expectedKey) {
        logger.warn('search.auth.unauthorized', { requestId, hasKey: !!providedKey });
        res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Invalid or missing API key' 
        });
        return;
      }
    }

    const { searchType, searchTerm, field, clientId, options = {} } = req.body;

    if (!searchType) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'searchType is required' 
      });
      return;
    }

    const searchOptions: SearchOptions = {
      limit: options.limit || 50,
      clientOnly: options.clientOnly || false,
      includeMetadata: options.includeMetadata !== false
    };

    logger.info('search.request', { 
      requestId, 
      searchType, 
      hasSearchTerm: !!searchTerm,
      hasClientId: !!clientId,
      options: searchOptions
    });

    let results: any;

    switch (searchType) {
      case 'fullName':
        if (!searchTerm) {
          res.status(400).json({ 
            error: 'Bad request', 
            message: 'searchTerm is required for fullName search' 
          });
          return;
        }
        results = await searchByFullName(searchTerm, searchOptions);
        break;

      case 'nationalId':
        if (!searchTerm) {
          res.status(400).json({ 
            error: 'Bad request', 
            message: 'searchTerm is required for nationalId search' 
          });
          return;
        }
        results = await searchByNationalId(searchTerm, searchOptions);
        break;

      case 'taxId':
        if (!searchTerm) {
          res.status(400).json({ 
            error: 'Bad request', 
            message: 'searchTerm is required for taxId search' 
          });
          return;
        }
        results = await searchByTaxId(searchTerm, searchOptions);
        break;

      case 'address': {
        if (!searchTerm) {
          res.status(400).json({ 
            error: 'Bad request', 
            message: 'searchTerm is required for address search' 
          });
          return;
        }
        const addressType = field === 'serviceAddress' ? 'service' : 'residential';
        results = await searchByAddress(searchTerm, addressType, searchOptions);
        break;
      }

      case 'clientName':
        if (!searchTerm) {
          res.status(400).json({ 
            error: 'Bad request', 
            message: 'searchTerm is required for clientName search' 
          });
          return;
        }
        results = await searchByClientName(searchTerm, searchOptions);
        break;

      case 'universal':
        if (!searchTerm) {
          res.status(400).json({ 
            error: 'Bad request', 
            message: 'searchTerm is required for universal search' 
          });
          return;
        }
        results = await universalSearch(searchTerm, searchOptions);
        break;

      case 'clientDetails':
        if (!clientId) {
          res.status(400).json({ 
            error: 'Bad request', 
            message: 'clientId is required for clientDetails search' 
          });
          return;
        }
        results = await getClientDetails(clientId, searchOptions);
        if (!results) {
          res.status(404).json({ 
            error: 'Not found', 
            message: 'Client not found' 
          });
          return;
        }
        break;

      default:
        res.status(400).json({ 
          error: 'Bad request', 
          message: `Unsupported search type: ${searchType}. Supported types: fullName, nationalId, taxId, address, clientName, universal, clientDetails` 
        });
        return;
    }

    logger.info('search.completed', { 
      requestId, 
      searchType, 
      resultCount: Array.isArray(results) ? results.length : (results ? 1 : 0)
    });

    res.status(200).json({
      success: true,
      searchType,
      resultCount: Array.isArray(results) ? results.length : (results ? 1 : 0),
      results,
      requestId
    });

  } catch (error) {
    logger.error('search.error', { 
      requestId, 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing your search request',
      requestId
    });
  }
});

/**
 * Health check endpoint for the search service
 */
export const searchHealthCheck = onRequest({ 
  cors: true,
  invoker: 'public'
}, async (req, res) => {
  try {
    // Basic health check - verify Firebase connection
    const db = admin.firestore();
    await db.collection('_health').limit(1).get();

    res.status(200).json({
      status: 'healthy',
      service: 'encrypted-data-search',
      timestamp: new Date().toISOString(),
      capabilities: [
        'fullName', 'nationalId', 'taxId', 
        'address', 'clientName', 'universal', 'clientDetails'
      ]
    });
  } catch (error) {
    logger.error('search.health.error', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'encrypted-data-search',
      error: 'Service unavailable'
    });
  }
});
