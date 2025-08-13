import { CloudEvent } from "firebase-functions/v2";
import { MessagePublishedData } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import * as puppeteer from "puppeteer";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import { emitEvent } from "./events";

const FSA_PUBLICATIONS_URL = "https://www.fsaseychelles.sc/publications";
const FSA_NEWS_URL = "https://www.fsaseychelles.sc/news-updates";
const FIU_WEBSITE_URL = "https://fiu.sc/";
const MONITORING_STATE_COLLECTION = "monitoring_state";
const FSA_DOCUMENT_ID = "fsa_publications_page";

const db = getFirestore();

// Snapshot storage configuration (Phase 1 foundation)
const SNAPSHOT_COLLECTION = "regulatory_snapshots";

interface MonitoringResult {
  timestamp: Date;
  changesDetected: number;
  criticalChanges: number;
  websitesChecked: number;
  errors: string[];
  notifications: NotificationSent[];
}

interface NotificationSent {
  type: 'EMAIL' | 'SMS' | 'SLACK';
  recipient: string;
  message: string;
  sentAt: Date;
}

// Comprehensive monitoring configuration
const MONITORING_TARGETS = [
  {
    name: 'FSA Publications',
    url: FSA_PUBLICATIONS_URL,
    selectors: ['.publication-item', '.document-link', '.announcement'],
    checkFrequency: 3600000, // 1 hour
    priority: 'HIGH'
  },
  {
    name: 'FSA News & Updates', 
    url: FSA_NEWS_URL,
    selectors: ['.news-item', '.update-item', '.alert'],
    checkFrequency: 1800000, // 30 minutes
    priority: 'CRITICAL'
  },
  {
    name: 'FIU Website',
    url: FIU_WEBSITE_URL,
    selectors: ['.announcement', '.news', '.guideline'],
    checkFrequency: 7200000, // 2 hours
    priority: 'MEDIUM'
  }
];

interface WebsiteChange {
  websiteName: string;
  url: string;
  changeType: 'NEW_CONTENT' | 'UPDATED_CONTENT' | 'REMOVED_CONTENT' | 'STRUCTURAL_CHANGE';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: Date;
  content?: string;
  affectedServices: string[];
  actionRequired: boolean;
  reviewRequired: boolean;
}

/**
 * A Cloud Function triggered by a Pub/Sub topic to monitor regulatory websites for changes.
 *
 * As per the implementation plan (Week 12), this function will:
 * 1. Use Puppeteer to scrape a target page (e.g., FSA Publications).
 * 2. Create a hash of the page's text content.
 * 3. Compare the new hash with the previously stored hash in Firestore.
 * 4. If the hashes differ, log a change and update the hash in Firestore.
 * 5. In the future, this will also trigger an alert.
 */
export const checkRegulatoryChanges = async (event: CloudEvent<MessagePublishedData>) => {
  logger.info(`Starting regulatory website check for ${FSA_PUBLICATIONS_URL}`, { messageId: event.id });
  await emitEvent("regulatory.page_fetched", { url: FSA_PUBLICATIONS_URL });

  let browser = null;
  try {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(FSA_PUBLICATIONS_URL, { waitUntil: "networkidle2" });

    let pageContent = await page.evaluate(() => document.body.innerText);
    const MAX_CONTENT_CHARS = 750000; // ~750 KB safeguard
    let truncated = false;
    if (pageContent.length > MAX_CONTENT_CHARS) {
      pageContent = pageContent.slice(0, MAX_CONTENT_CHARS);
      truncated = true;
    }
    const currentHash = crypto.createHash("sha256").update(pageContent).digest("hex");

    const stateDocRef = db.collection(MONITORING_STATE_COLLECTION).doc(FSA_DOCUMENT_ID);
    const stateDoc = await stateDocRef.get();
    const previousHash = stateDoc.exists ? stateDoc.data()?.hash : null;

    if (currentHash !== previousHash) {
      logger.warn("Regulatory change detected", { currentHash, previousHash });
      await stateDocRef.set({ hash: currentHash, lastUpdated: new Date(), previousHash });

      // Persist snapshot document for audit & future diff analysis
      const snapshotRef = await db.collection(SNAPSHOT_COLLECTION).add({
        url: FSA_PUBLICATIONS_URL,
        capturedAt: new Date(),
        hash: currentHash,
        previousHash: previousHash || null,
        length: pageContent.length,
        truncated,
        // For now store raw text (Phase 1). Later we can store structured extraction & diff summary.
        content: pageContent
      });
      await emitEvent("regulatory.snapshot.stored", { snapshotId: snapshotRef.id, url: FSA_PUBLICATIONS_URL, hash: currentHash, previousHash, truncated });

      await emitEvent("regulatory.diff_detected", { url: FSA_PUBLICATIONS_URL, hash_before: previousHash, hash_after: currentHash });
    } else {
      logger.info("No changes detected on the page.");
    }
  } catch (error) {
    logger.error("Error during Puppeteer execution", { error });
    await emitEvent("regulatory.fetch.error", { url: FSA_PUBLICATIONS_URL, message: (error as any)?.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  logger.info("Regulatory website check completed.");
  return null;
};

/**
 * Comprehensive regulatory monitoring function for multiple websites
 */
export const comprehensiveRegulatoryMonitoring = async (event: CloudEvent<MessagePublishedData>) => {
  logger.info('🔍 Starting comprehensive regulatory monitoring', { messageId: event.id });
  
  const result: MonitoringResult = {
    timestamp: new Date(),
    changesDetected: 0,
    criticalChanges: 0,
    websitesChecked: 0,
    errors: [],
    notifications: []
  };

  let browser = null;
  try {
    browser = await puppeteer.launch({ 
      headless: true, 
      args: ["--no-sandbox", "--disable-setuid-sandbox"] 
    });

    // Monitor each target website
    for (const target of MONITORING_TARGETS) {
      try {
        logger.info(`📋 Checking ${target.name}...`);
        const changes = await monitorWebsite(browser, target);
        
        result.websitesChecked++;
        result.changesDetected += changes.length;
        result.criticalChanges += changes.filter(c => c.severity === 'CRITICAL').length;

        // Process critical changes immediately
        for (const change of changes.filter(c => c.severity === 'CRITICAL')) {
          await processCriticalChange(change, result);
        }

        await emitEvent("regulatory.website.checked", {
          website: target.name,
          url: target.url,
          changesFound: changes.length,
          criticalChanges: changes.filter(c => c.severity === 'CRITICAL').length
        });

      } catch (error) {
        logger.error(`❌ Error monitoring ${target.name}:`, error);
        result.errors.push(`${target.name}: ${(error as Error).message}`);
        
        await emitEvent("regulatory.website.error", {
          website: target.name,
          url: target.url,
          error: (error as Error).message
        });
      }
    }

    // Store comprehensive monitoring results
    await storeMonitoringResults(result);

    logger.info('✅ Comprehensive monitoring completed', {
      websitesChecked: result.websitesChecked,
      changesDetected: result.changesDetected,
      criticalChanges: result.criticalChanges,
      errors: result.errors.length
    });

  } catch (error) {
    logger.error('❌ Comprehensive monitoring failed:', error);
    result.errors.push(`System error: ${(error as Error).message}`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return result;
};

/**
 * Monitor a specific website for changes
 */
async function monitorWebsite(browser: any, target: any): Promise<WebsiteChange[]> {
  const changes: WebsiteChange[] = [];
  
  try {
    const page = await browser.newPage();
    await page.goto(target.url, { waitUntil: "networkidle2", timeout: 30000 });

    // Get page content and structure
    const pageData = await page.evaluate((selectors: string[]) => {
      const content = document.body.innerText;
      const structuredData: Array<{selector: string, text: string, html: string}> = [];
      
      // Extract content from specific selectors
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          structuredData.push({
            selector,
            text: el.textContent?.trim() || '',
            html: el.outerHTML
          });
        });
      }
      
      return {
        content,
        structured: structuredData,
        title: document.title,
        lastModified: document.lastModified
      };
    }, target.selectors);

    // Create hash of current content
    const currentHash = crypto.createHash("sha256")
      .update(pageData.content + JSON.stringify(pageData.structured))
      .digest("hex");

    // Check for changes against stored state
    const stateDocRef = db.collection(MONITORING_STATE_COLLECTION).doc(`${target.name.replace(/\s+/g, '_')}_state`);
    const stateDoc = await stateDocRef.get();
    const previousState = stateDoc.exists ? stateDoc.data() : null;

    if (!previousState || currentHash !== previousState.hash) {
      // Analyze the type of change
      const change = await analyzeChange(target, pageData, previousState);
      changes.push(change);

      // Update state
      await stateDocRef.set({
        hash: currentHash,
        lastUpdated: new Date(),
        previousHash: previousState?.hash || null,
        content: pageData.content.substring(0, 50000), // Store first 50KB
        structured: pageData.structured.slice(0, 100) // Store first 100 structured elements
      });

      // Store change in dedicated collection
      await db.collection('regulatory_changes').add({
        ...change,
        pageData: {
          title: pageData.title,
          lastModified: pageData.lastModified,
          contentLength: pageData.content.length
        }
      });

      logger.info(`📝 Change detected on ${target.name}:`, {
        changeType: change.changeType,
        severity: change.severity,
        description: change.description
      });
    }

    await page.close();
    
  } catch (error) {
    logger.error(`❌ Error monitoring ${target.name}:`, error);
    throw error;
  }

  return changes;
}

/**
 * Analyze the type and severity of detected changes
 */
async function analyzeChange(target: any, currentData: any, previousState: any): Promise<WebsiteChange> {
  const change: WebsiteChange = {
    websiteName: target.name,
    url: target.url,
    changeType: 'UPDATED_CONTENT',
    description: '',
    severity: 'MEDIUM',
    detectedAt: new Date(),
    affectedServices: [],
    actionRequired: false,
    reviewRequired: true
  };

  // Analyze content for specific regulatory keywords
  const criticalKeywords = [
    'new regulation', 'amendment', 'compliance', 'deadline', 'requirement',
    'beneficial ownership', 'AML', 'CTF', 'VASP', 'license', 'registration',
    'penalty', 'fine', 'suspension', 'revocation', 'cease and desist'
  ];

  const highPriorityKeywords = [
    'guidance', 'circular', 'directive', 'policy', 'procedure', 'form',
    'application', 'renewal', 'reporting', 'disclosure'
  ];

  const content = currentData.content.toLowerCase();
  const hasNewContent = !previousState;
  const hasCriticalKeywords = criticalKeywords.some(keyword => 
    content.includes(keyword.toLowerCase())
  );
  const hasHighPriorityKeywords = highPriorityKeywords.some(keyword =>
    content.includes(keyword.toLowerCase())
  );

  // Determine severity and action required
  if (hasNewContent && hasCriticalKeywords) {
    change.severity = 'CRITICAL';
    change.actionRequired = true;
    change.description = `New critical regulatory content detected on ${target.name}`;
  } else if (hasCriticalKeywords) {
    change.severity = 'HIGH';
    change.actionRequired = true;
    change.description = `Critical regulatory updates detected on ${target.name}`;
  } else if (hasHighPriorityKeywords) {
    change.severity = 'MEDIUM';
    change.reviewRequired = true;
    change.description = `Regulatory guidance updates detected on ${target.name}`;
  } else {
    change.severity = 'LOW';
    change.description = `General content updates detected on ${target.name}`;
  }

  // Determine affected services
  if (content.includes('beneficial ownership') || content.includes('bo database')) {
    change.affectedServices.push('FIU BO Integration');
  }
  if (content.includes('ibc') || content.includes('company formation')) {
    change.affectedServices.push('IBC Formation Service');
  }
  if (content.includes('vasp') || content.includes('virtual asset')) {
    change.affectedServices.push('VASP Registration');
  }
  if (content.includes('aml') || content.includes('anti-money laundering')) {
    change.affectedServices.push('AML Compliance');
  }

  return change;
}

/**
 * Process critical changes immediately
 */
async function processCriticalChange(change: WebsiteChange, result: MonitoringResult): Promise<void> {
  logger.warn('🚨 Processing critical regulatory change:', change);

  try {
    // Send immediate notification
    const notification = await sendCriticalNotification(change);
    result.notifications.push(notification);

    // Create high-priority task for compliance team
    await db.collection('compliance_tasks').add({
      type: 'CRITICAL_REGULATORY_CHANGE',
      title: `URGENT: ${change.description}`,
      websiteName: change.websiteName,
      url: change.url,
      changeDetails: change,
      priority: 'CRITICAL',
      status: 'PENDING',
      assignedTo: 'compliance-team',
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Emit event for other systems to react
    await emitEvent("regulatory.critical_change", {
      website: change.websiteName,
      changeType: change.changeType,
      severity: change.severity,
      affectedServices: change.affectedServices,
      actionRequired: change.actionRequired
    });

    logger.info('✅ Critical change processing completed');

  } catch (error) {
    logger.error('❌ Failed to process critical change:', error);
    result.errors.push(`Critical change processing failed: ${(error as Error).message}`);
  }
}

/**
 * Send critical change notification
 */
async function sendCriticalNotification(change: WebsiteChange): Promise<NotificationSent> {
  const notificationMessage = `🚨 CRITICAL REGULATORY CHANGE DETECTED

Website: ${change.websiteName}
Change: ${change.description}
Time: ${change.detectedAt.toLocaleString()}
Affected Services: ${change.affectedServices.join(', ') || 'Multiple services may be affected'}
Action Required: ${change.actionRequired ? 'YES - Immediate action needed' : 'Review required'}

Please review immediately and take necessary action.

Seychelles Compliance Hub - Automated Monitoring System`;

  // Log notification (implement actual sending in production)
  logger.info('📧 Critical notification sent:', {
    recipient: 'compliance@seychelleshub.com',
    message: change.description,
    fullMessage: notificationMessage
  });

  return {
    type: 'EMAIL',
    recipient: 'compliance@seychelleshub.com',
    message: change.description,
    sentAt: new Date()
  };
}

/**
 * Store monitoring results for dashboard
 */
async function storeMonitoringResults(result: MonitoringResult): Promise<void> {
  try {
    await db.collection('monitoring_results').add({
      ...result,
      environment: process.env.NODE_ENV || 'production',
      function: 'comprehensive-regulatory-monitoring',
      version: '1.0.0'
    });

    logger.info('📊 Monitoring results stored successfully');

  } catch (error) {
    logger.error('❌ Failed to store monitoring results:', error);
    // Don't throw - this is not critical for the monitoring function
  }
}