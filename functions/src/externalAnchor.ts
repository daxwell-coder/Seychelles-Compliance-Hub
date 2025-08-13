import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as crypto from "crypto";
import { emitEvent } from "./events";

/**
 * External Anchoring Service for Task #4
 * 
 * Provides external anchoring of audit/obligation chain roots to strengthen tamper-evidence
 * by publishing root hashes to external immutable systems.
 * 
 * Current implementation: Stub provider using signed JSON + public gist URL
 * Future: Real blockchain/timestamping providers (OpenTimestamps, etc.)
 */

// Types
interface ChainRoot {
  hash: string;
  previousHash: string;
  algorithm: string;
  computedAt: string;
  chainType: 'audit' | 'obligations';
}

interface AnchorProvider {
  name: string;
  publish(payload: AnchorPayload): Promise<AnchorResult>;
  verify(anchorTxId: string): Promise<AnchorVerification>;
}

interface AnchorPayload {
  combinedRootHash: string;
  merkleProofs: string[];
  timestamp: string;
  chainRoots: ChainRoot[];
  platformId: string;
}

interface AnchorResult {
  anchorTxId: string;
  providerName: string;
  anchorUrl?: string;
  cost?: number;
  metadata?: any;
}

interface AnchorVerification {
  isValid: boolean;
  anchorTimestamp: string;
  providerMetadata?: any;
}

/**
 * Stub Anchor Provider
 * Uses signed JSON payload published to a public gist URL
 */
class StubGistAnchorProvider implements AnchorProvider {
  name = "stub-gist-v1";
  
  async publish(payload: AnchorPayload): Promise<AnchorResult> {
    const timestamp = new Date().toISOString();
    const anchorTxId = `stub-${crypto.randomUUID()}`;
    
    // Create signed payload
    const signedPayload = {
      payload,
      signature: this.signPayload(payload),
      timestamp,
      provider: this.name,
      anchorTxId
    };
    
    // In a real implementation, this would publish to GitHub Gist API
    // For now, we simulate and store locally
    const firestore = getFirestore();
    await firestore.collection("_external_anchors").doc(anchorTxId).set({
      ...signedPayload,
      status: "published",
      publishedAt: timestamp
    });
    
    const anchorUrl = `https://gist.githubusercontent.com/stub/${anchorTxId}.json`;
    
    logger.info("external.anchor.published", {
      anchorTxId,
      anchorUrl,
      combinedRootHash: payload.combinedRootHash,
      chainCount: payload.chainRoots.length
    });
    
    return {
      anchorTxId,
      providerName: this.name,
      anchorUrl,
      cost: 0, // Stub provider is free
      metadata: { signedPayload }
    };
  }
  
  async verify(anchorTxId: string): Promise<AnchorVerification> {
    const firestore = getFirestore();
    const doc = await firestore.collection("_external_anchors").doc(anchorTxId).get();
    
    if (!doc.exists) {
      return { isValid: false, anchorTimestamp: "" };
    }
    
    const data = doc.data()!;
    const isValidSignature = this.verifyPayload(data.payload, data.signature);
    
    return {
      isValid: isValidSignature && data.status === "published",
      anchorTimestamp: data.timestamp,
      providerMetadata: data
    };
  }
  
  private signPayload(payload: AnchorPayload): string {
    // In production, use proper signing key from Secret Manager
    const secretKey = "stub-signing-key-for-demo";
    const payloadJson = JSON.stringify(payload, Object.keys(payload).sort());
    
    return crypto
      .createHmac('sha256', secretKey)
      .update(payloadJson)
      .digest('hex');
  }
  
  private verifyPayload(payload: AnchorPayload, signature: string): boolean {
    const expectedSignature = this.signPayload(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

/**
 * External Anchor Service Class
 */
class ExternalAnchorService {
  private providers: AnchorProvider[] = [
    new StubGistAnchorProvider()
  ];
  
  private firestore = getFirestore();
  
  async processChainComputedEvent(eventData: any) {
    logger.info("processing.chain.computed.event", eventData);
    
    try {
      // Store the chain root for aggregation
      await this.storeChainRoot(eventData);
      
      // Check if we need to publish an anchor (weekly schedule)
      const shouldPublish = await this.shouldPublishAnchor();
      if (shouldPublish) {
        await this.publishWeeklyAnchor();
      }
    } catch (error) {
      logger.error("chain.computed.processing.error", { error, eventData });
      throw error;
    }
  }
  
  private async storeChainRoot(eventData: any) {
    const timestamp = new Date().toISOString();
    const chainType = this.detectChainType(eventData);
    
    const chainRoot: ChainRoot = {
      hash: eventData.newHash,
      previousHash: eventData.previousHash || "GENESIS",
      algorithm: eventData.algorithm || "sha256",
      computedAt: timestamp,
      chainType
    };
    
    const docId = `${chainType}-${timestamp}`;
    await this.firestore.collection("_chain_roots_pending").doc(docId).set({
      ...chainRoot,
      processed: false,
      storedAt: timestamp
    });
    
    logger.info("chain.root.stored", { docId, chainType, hash: chainRoot.hash });
  }
  
  private detectChainType(eventData: any): 'audit' | 'obligations' {
    // Simple heuristic based on event structure/source
    // In production, this would be more sophisticated
    if (eventData.aggregationMarker && eventData.aggregationMarker.startsWith('DAY:')) {
      return 'audit';
    }
    return 'obligations';
  }
  
  private async shouldPublishAnchor(): Promise<boolean> {
    // Check if we have unpublished roots that are old enough (weekly)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const pendingRoots = await this.firestore
      .collection("_chain_roots_pending")
      .where("processed", "==", false)
      .where("storedAt", "<=", oneWeekAgo.toISOString())
      .limit(1)
      .get();
    
    return !pendingRoots.empty;
  }
  
  async publishWeeklyAnchor() {
    logger.info("publishing.weekly.anchor");
    
    try {
      // Get all unpublished chain roots
      const pendingRoots = await this.firestore
        .collection("_chain_roots_pending")
        .where("processed", "==", false)
        .orderBy("storedAt")
        .get();
      
      if (pendingRoots.empty) {
        logger.info("no.pending.roots.for.anchoring");
        return;
      }
      
      const chainRoots: ChainRoot[] = pendingRoots.docs.map(doc => ({
        hash: doc.data().hash,
        previousHash: doc.data().previousHash,
        algorithm: doc.data().algorithm,
        computedAt: doc.data().computedAt,
        chainType: doc.data().chainType
      }));
      
      // Compute combined root hash (simple concatenation for now)
      const combinedInput = chainRoots
        .map(root => `${root.chainType}:${root.hash}`)
        .sort()
        .join('|');
      
      const combinedRootHash = crypto
        .createHash('sha256')
        .update(combinedInput)
        .digest('hex');
      
      // Generate merkle proofs (simplified for now)
      const merkleProofs = chainRoots.map(root => 
        crypto.createHash('sha256').update(`proof:${root.hash}`).digest('hex')
      );
      
      const anchorPayload: AnchorPayload = {
        combinedRootHash,
        merkleProofs,
        timestamp: new Date().toISOString(),
        chainRoots,
        platformId: "seychelles-compliance-hub"
      };
      
      // Publish to external anchor provider
      const provider = this.providers[0]; // Use first available provider
      const result = await provider.publish(anchorPayload);
      
      // Store anchor record
      await this.firestore.collection("_external_anchor_records").add({
        ...result,
        anchorPayload,
        publishedAt: new Date().toISOString(),
        status: "published",
        chainRootsCount: chainRoots.length
      });
      
      // Mark chain roots as processed
      const batch = this.firestore.batch();
      pendingRoots.docs.forEach(doc => {
        batch.update(doc.ref, { 
          processed: true, 
          processedAt: new Date().toISOString(),
          anchorTxId: result.anchorTxId
        });
      });
      await batch.commit();
      
      // Emit anchor published event
      await emitEvent('chain.anchor.published', {
        anchorTxId: result.anchorTxId,
        providerName: result.providerName,
        anchorUrl: result.anchorUrl,
        combinedRootHash,
        chainRootsCount: chainRoots.length,
        timestamp: anchorPayload.timestamp
      });
      
      logger.info("weekly.anchor.published", {
        anchorTxId: result.anchorTxId,
        chainRootsCount: chainRoots.length,
        combinedRootHash
      });
      
    } catch (error) {
      logger.error("weekly.anchor.publishing.error", { error });
      throw error;
    }
  }
  
  async verifyAnchor(anchorTxId: string): Promise<AnchorVerification> {
    const provider = this.providers[0]; // Use first available provider for now
    return await provider.verify(anchorTxId);
  }
  
  async getAnchorStatus() {
    const [pendingCount, publishedCount] = await Promise.all([
      this.firestore.collection("_chain_roots_pending")
        .where("processed", "==", false)
        .count()
        .get()
        .then(snapshot => snapshot.data().count),
      
      this.firestore.collection("_external_anchor_records")
        .where("status", "==", "published")
        .count()
        .get()
        .then(snapshot => snapshot.data().count)
    ]);
    
    // Get latest anchor
    const latestAnchor = await this.firestore
      .collection("_external_anchor_records")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();
    
    const latestAnchorData = latestAnchor.empty ? null : {
      anchorTxId: latestAnchor.docs[0].data().anchorTxId,
      publishedAt: latestAnchor.docs[0].data().publishedAt,
      combinedRootHash: latestAnchor.docs[0].data().anchorPayload.combinedRootHash
    };
    
    return {
      pendingChainRoots: pendingCount,
      publishedAnchors: publishedCount,
      latestAnchor: latestAnchorData,
      providers: this.providers.map(p => p.name)
    };
  }
}

const anchorService = new ExternalAnchorService();

/**
 * Cloud Function: Process chain computed events
 * Triggered by PubSub when audit or obligation chain roots are computed
 */
export const processChainForAnchoring = onMessagePublished(
  "platform-events", 
  async (event) => {
    const eventData = event.data.message.json;
    
    // Only process chain computation events
    if (eventData.event_type === 'audit.hash.chain.computed') {
      await anchorService.processChainComputedEvent(eventData.data);
    }
  }
);

/**
 * Cloud Function: Weekly anchor publisher
 * Scheduled job that publishes accumulated chain roots to external anchors
 */
export const weeklyAnchorPublisher = onSchedule(
  { schedule: "0 2 * * 0" }, // Every Sunday at 2 AM
  async () => {
    await anchorService.publishWeeklyAnchor();
  }
);

/**
 * Cloud Function: Manual anchor trigger (for testing/emergency)
 * HTTP endpoint to manually trigger anchor publishing
 */
export const publishAnchorManual = onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    await anchorService.publishWeeklyAnchor();
    res.json({ 
      status: 'success', 
      message: 'Anchor publishing triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("manual.anchor.publish.error", { error });
    res.status(500).json({ 
      error: 'Anchor publishing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cloud Function: Anchor verification endpoint
 * HTTP endpoint to verify specific anchor transactions
 */
export const verifyAnchor = onRequest(async (req, res) => {
  try {
    const anchorTxId = req.query.anchorTxId as string;
    
    if (!anchorTxId) {
      res.status(400).json({ error: 'anchorTxId parameter required' });
      return;
    }
    
    const verification = await anchorService.verifyAnchor(anchorTxId);
    res.json({
      anchorTxId,
      verification,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("anchor.verification.error", { error, anchorTxId: req.query.anchorTxId });
    res.status(500).json({ 
      error: 'Anchor verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cloud Function: Anchor status endpoint
 * HTTP endpoint to get current anchoring system status
 */
export const anchorStatus = onRequest(async (req, res) => {
  try {
    const status = await anchorService.getAnchorStatus();
    res.json({
      status: 'healthy',
      anchoring: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("anchor.status.error", { error });
    res.status(500).json({ 
      status: 'error',
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
