import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { deterministicEncryption, createBeneficialOwnerSearchQuery } from './deterministicEncryption';

/**
 * Encrypted Data Search Utility
 * 
 * Provides search capabilities for encrypted PII fields using searchable hashes.
 * This enables finding records without decrypting the sensitive data.
 */

export interface SearchResult {
  clientId: string;
  matchType: 'client' | 'beneficial_owner';
  matchField: string;
  beneficialOwnerId?: string;
}

export interface SearchOptions {
  limit?: number;
  clientOnly?: boolean;
  includeMetadata?: boolean;
}

/**
 * Search for clients by encrypted full name
 */
export async function searchByFullName(
  fullName: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const db = admin.firestore();
  const results: SearchResult[] = [];
  const limit = options.limit || 100;

  try {
    const searchQuery = createBeneficialOwnerSearchQuery('fullName', fullName);
    if (!searchQuery) {
      logger.warn('search.fullname.not-searchable', { fullName: '***' });
      return results;
    }

    // Search beneficial owners collection
    if (!options.clientOnly) {
      const boQuery = db.collectionGroup('beneficial_owners')
        .where(searchQuery.field, '==', searchQuery.hash)
        .limit(limit);

      const boSnapshot = await boQuery.get();
      
      for (const doc of boSnapshot.docs) {
        const parentPath = doc.ref.parent.parent;
        if (parentPath) {
          results.push({
            clientId: parentPath.id,
            matchType: 'beneficial_owner',
            matchField: 'fullName',
            beneficialOwnerId: doc.id
          });
        }
      }
    }

    logger.info('search.fullname.completed', { 
      query: searchQuery.field,
      resultsCount: results.length 
    });

    return results;
  } catch (error) {
    logger.error('search.fullname.error', { error });
    throw new Error('Failed to search by full name');
  }
}

/**
 * Search for clients by national ID number
 */
export async function searchByNationalId(
  nationalId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const db = admin.firestore();
  const results: SearchResult[] = [];
  const limit = options.limit || 100;

  try {
    const searchQuery = createBeneficialOwnerSearchQuery('nationalIdNumber', nationalId);
    if (!searchQuery) {
      logger.warn('search.national-id.not-searchable');
      return results;
    }

    const boQuery = db.collectionGroup('beneficial_owners')
      .where(searchQuery.field, '==', searchQuery.hash)
      .limit(limit);

    const boSnapshot = await boQuery.get();
    
    for (const doc of boSnapshot.docs) {
      const parentPath = doc.ref.parent.parent;
      if (parentPath) {
        results.push({
          clientId: parentPath.id,
          matchType: 'beneficial_owner',
          matchField: 'nationalIdNumber',
          beneficialOwnerId: doc.id
        });
      }
    }

    logger.info('search.national-id.completed', { 
      query: searchQuery.field,
      resultsCount: results.length 
    });

    return results;
  } catch (error) {
    logger.error('search.national-id.error', { error });
    throw new Error('Failed to search by national ID');
  }
}

/**
 * Search for clients by tax ID number
 */
export async function searchByTaxId(
  taxId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const db = admin.firestore();
  const results: SearchResult[] = [];
  const limit = options.limit || 100;

  try {
    const searchQuery = createBeneficialOwnerSearchQuery('taxIdNumber', taxId);
    if (!searchQuery) {
      logger.warn('search.tax-id.not-searchable');
      return results;
    }

    const boQuery = db.collectionGroup('beneficial_owners')
      .where(searchQuery.field, '==', searchQuery.hash)
      .limit(limit);

    const boSnapshot = await boQuery.get();
    
    for (const doc of boSnapshot.docs) {
      const parentPath = doc.ref.parent.parent;
      if (parentPath) {
        results.push({
          clientId: parentPath.id,
          matchType: 'beneficial_owner',
          matchField: 'taxIdNumber',
          beneficialOwnerId: doc.id
        });
      }
    }

    logger.info('search.tax-id.completed', { 
      query: searchQuery.field,
      resultsCount: results.length 
    });

    return results;
  } catch (error) {
    logger.error('search.tax-id.error', { error });
    throw new Error('Failed to search by tax ID');
  }
}

/**
 * Search for clients by address (residential or service)
 */
export async function searchByAddress(
  address: string,
  addressType: 'residential' | 'service' = 'residential',
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const db = admin.firestore();
  const results: SearchResult[] = [];
  const limit = options.limit || 100;
  const fieldName = addressType === 'residential' ? 'residentialAddress' : 'serviceAddress';

  try {
    const searchQuery = createBeneficialOwnerSearchQuery(fieldName as any, address);
    if (!searchQuery) {
      logger.warn('search.address.not-searchable', { addressType });
      return results;
    }

    const boQuery = db.collectionGroup('beneficial_owners')
      .where(searchQuery.field, '==', searchQuery.hash)
      .limit(limit);

    const boSnapshot = await boQuery.get();
    
    for (const doc of boSnapshot.docs) {
      const parentPath = doc.ref.parent.parent;
      if (parentPath) {
        results.push({
          clientId: parentPath.id,
          matchType: 'beneficial_owner',
          matchField: fieldName,
          beneficialOwnerId: doc.id
        });
      }
    }

    logger.info('search.address.completed', { 
      addressType,
      query: searchQuery.field,
      resultsCount: results.length 
    });

    return results;
  } catch (error) {
    logger.error('search.address.error', { addressType, error });
    throw new Error(`Failed to search by ${addressType} address`);
  }
}

/**
 * Search for clients by client name (company name)
 */
export async function searchByClientName(
  clientName: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const db = admin.firestore();
  const results: SearchResult[] = [];
  const limit = options.limit || 100;

  try {
    // Client names are typically not encrypted, just hashed for search
    const searchHash = deterministicEncryption.generateSearchHash('clientName', clientName);
    if (!searchHash) {
      // Fallback to regular text search if no hash available
      logger.info('search.client-name.fallback-to-text', { clientName: '***' });
      
      const clientQuery = db.collection('clients')
        .where('name', '==', clientName)
        .limit(limit);

      const clientSnapshot = await clientQuery.get();
      
      for (const doc of clientSnapshot.docs) {
        results.push({
          clientId: doc.id,
          matchType: 'client',
          matchField: 'name'
        });
      }
    } else {
      // Search using hash
      const clientQuery = db.collection('clients')
        .where('clientName_searchHash', '==', searchHash)
        .limit(limit);

      const clientSnapshot = await clientQuery.get();
      
      for (const doc of clientSnapshot.docs) {
        results.push({
          clientId: doc.id,
          matchType: 'client',
          matchField: 'clientName'
        });
      }
    }

    logger.info('search.client-name.completed', { 
      resultsCount: results.length,
      method: searchHash ? 'hash' : 'text'
    });

    return results;
  } catch (error) {
    logger.error('search.client-name.error', { error });
    throw new Error('Failed to search by client name');
  }
}

/**
 * Universal search function that tries multiple fields
 */
export async function universalSearch(
  searchTerm: string,
  options: SearchOptions = {}
): Promise<{ field: string; results: SearchResult[] }[]> {
  const searchResults: { field: string; results: SearchResult[] }[] = [];

  try {
    // Search all encrypted fields in parallel
    const [
      fullNameResults,
      nationalIdResults,
      taxIdResults,
      residentialAddressResults,
      serviceAddressResults,
      clientNameResults
    ] = await Promise.allSettled([
      searchByFullName(searchTerm, options),
      searchByNationalId(searchTerm, options),
      searchByTaxId(searchTerm, options),
      searchByAddress(searchTerm, 'residential', options),
      searchByAddress(searchTerm, 'service', options),
      searchByClientName(searchTerm, options)
    ]);

    // Collect successful results
    if (fullNameResults.status === 'fulfilled' && fullNameResults.value.length > 0) {
      searchResults.push({ field: 'fullName', results: fullNameResults.value });
    }
    
    if (nationalIdResults.status === 'fulfilled' && nationalIdResults.value.length > 0) {
      searchResults.push({ field: 'nationalIdNumber', results: nationalIdResults.value });
    }
    
    if (taxIdResults.status === 'fulfilled' && taxIdResults.value.length > 0) {
      searchResults.push({ field: 'taxIdNumber', results: taxIdResults.value });
    }
    
    if (residentialAddressResults.status === 'fulfilled' && residentialAddressResults.value.length > 0) {
      searchResults.push({ field: 'residentialAddress', results: residentialAddressResults.value });
    }
    
    if (serviceAddressResults.status === 'fulfilled' && serviceAddressResults.value.length > 0) {
      searchResults.push({ field: 'serviceAddress', results: serviceAddressResults.value });
    }
    
    if (clientNameResults.status === 'fulfilled' && clientNameResults.value.length > 0) {
      searchResults.push({ field: 'clientName', results: clientNameResults.value });
    }

    // Log any failed searches
    const failedSearches = [
      fullNameResults, nationalIdResults, taxIdResults, 
      residentialAddressResults, serviceAddressResults, clientNameResults
    ].filter(result => result.status === 'rejected');

    if (failedSearches.length > 0) {
      logger.warn('search.universal.partial-failures', { 
        failedCount: failedSearches.length,
        totalFields: 6 
      });
    }

    logger.info('search.universal.completed', { 
      searchTerm: '***',
      fieldsWithResults: searchResults.length,
      totalResults: searchResults.reduce((sum, r) => sum + r.results.length, 0)
    });

    return searchResults;
  } catch (error) {
    logger.error('search.universal.error', { error });
    throw new Error('Universal search failed');
  }
}

/**
 * Get detailed client information (for authorized users only)
 * Note: This function returns encrypted data - decryption would require additional authorization
 */
export async function getClientDetails(
  clientId: string,
  options: SearchOptions = {}
): Promise<any | null> {
  const db = admin.firestore();

  try {
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
      return null;
    }

    const clientData = clientDoc.data();
    const result: any = { 
      id: clientId,
      ...clientData 
    };

    // Include beneficial owners if requested
    if (options.includeMetadata !== false) {
      const boSnapshot = await clientDoc.ref.collection('beneficial_owners').get();
      result.beneficialOwners = boSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    logger.info('search.client-details.retrieved', { 
      clientId,
      hasBeneficialOwners: !!result.beneficialOwners,
      beneficialOwnerCount: result.beneficialOwners?.length || 0
    });

    return result;
  } catch (error) {
    logger.error('search.client-details.error', { clientId, error });
    throw new Error('Failed to retrieve client details');
  }
}
